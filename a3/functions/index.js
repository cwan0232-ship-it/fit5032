// UrbanCanopy Melbourne - Cloud Functions (BR E.1)
const { setGlobalOptions } = require('firebase-functions/v2')
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret, defineString } = require('firebase-functions/params')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')
const cors = require('cors')({ origin: true })
const sessions = require('./data/sessions.json')
const sites = require('./data/sites.json')

admin.initializeApp()
const db = admin.firestore()

// Melbourne region, close to the Firestore database
setGlobalOptions({ region: 'australia-southeast2', maxInstances: 5 })

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const SENDGRID_FROM = defineString('SENDGRID_FROM', { default: 'no-reply@urbancanopy.org.au' })

const sessionById = new Map(sessions.map((session) => [session.id, session]))
const MAX_ACTIVE_BOOKINGS = 5
const ATTACHMENT_TYPES = ['application/pdf', 'text/csv', 'text/calendar']
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to continue.')
  return request.auth
}

async function getMember(uid) {
  const snapshot = await db.collection('members').doc(uid).get()
  if (!snapshot.exists) throw new HttpsError('permission-denied', 'No member profile was found.')
  return snapshot.data()
}

async function requireAdmin(request) {
  const { uid } = requireAuth(request)
  const member = await getMember(uid)
  if (member.role !== 'admin') throw new HttpsError('permission-denied', 'Administrators only.')
  return member
}

function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

function emailBody(message) {
  const paragraphs = escapeHtml(message).split(/\n{2,}/).map((part) => `<p>${part.replace(/\n/g, '<br>')}</p>`)
  return `<div style="font-family:Arial,sans-serif;color:#15251f">${paragraphs.join('')}<p style="color:#607069">UrbanCanopy Melbourne</p></div>`
}

function useSendGrid() {
  const key = SENDGRID_API_KEY.value()
  if (!key || !key.startsWith('SG.')) {
    throw new HttpsError('failed-precondition', 'The email service has not been configured yet.')
  }
  sgMail.setApiKey(key)
}

const overlaps = (a, b) => new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end)

// E.1 Project ratings - the server checks each score and keeps the project averages up to date
const projectIds = new Set(sessions.map((session) => session.projectId))

exports.submitRating = onCall(async (request) => {
  const { uid } = requireAuth(request)
  const projectId = String(request.data?.projectId ?? '')
  const score = Number(request.data?.score)
  if (!projectIds.has(projectId)) throw new HttpsError('not-found', 'That project does not exist.')
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new HttpsError('invalid-argument', 'Choose a rating from 1 to 5.')
  }

  const ratingRef = db.collection('ratings').doc(`${uid}_${projectId}`)
  const statsRef = db.collection('projectStats').doc(projectId)

  return db.runTransaction(async (transaction) => {
    const [rating, stats] = await Promise.all([transaction.get(ratingRef), transaction.get(statsRef)])
    const previous = rating.exists ? rating.data().score : 0
    const count = (stats.data()?.count ?? 0) + (rating.exists ? 0 : 1)
    const total = (stats.data()?.total ?? 0) - previous + score
    const average = Math.round((total / count) * 10) / 10

    transaction.set(ratingRef, { uid, projectId, score, updatedAt: new Date().toISOString() })
    transaction.set(statsRef, { count, total, average })
    logger.info('Rating saved', { uid, projectId, score })
    return { average, count }
  })
})

// F.1 Calendar booking - all booking rules are enforced here, not in the browser
exports.createBooking = onCall(async (request) => {
  const { uid } = requireAuth(request)
  const session = sessionById.get(String(request.data?.sessionId ?? ''))
  if (!session) throw new HttpsError('not-found', 'That session does not exist.')
  if (new Date(session.start) <= new Date()) {
    throw new HttpsError('failed-precondition', 'This session has already started.')
  }

  const member = await getMember(uid)
  const bookingRef = db.collection('bookings').doc(`${uid}_${session.id}`)
  const statsRef = db.collection('sessionStats').doc(session.id)

  return db.runTransaction(async (transaction) => {
    const [existing, stats, mine] = await Promise.all([
      transaction.get(bookingRef),
      transaction.get(statsRef),
      transaction.get(db.collection('bookings').where('uid', '==', uid)),
    ])
    if (existing.exists) throw new HttpsError('already-exists', 'You have already booked this session.')

    const upcoming = mine.docs.map((doc) => doc.data()).filter((booking) => new Date(booking.end) > new Date())
    const clash = upcoming.find((booking) => overlaps(booking, session))
    if (clash) {
      throw new HttpsError('failed-precondition', `This overlaps with your booking for ${clash.title}.`)
    }
    if (upcoming.length >= MAX_ACTIVE_BOOKINGS) {
      throw new HttpsError('resource-exhausted', `You can hold up to ${MAX_ACTIVE_BOOKINGS} upcoming bookings.`)
    }

    const booked = stats.exists ? stats.data().booked : 0
    if (booked >= session.capacity) throw new HttpsError('resource-exhausted', 'This session is full.')

    const booking = {
      uid,
      sessionId: session.id,
      projectId: session.projectId,
      title: session.title,
      suburb: session.suburb,
      start: session.start,
      end: session.end,
      displayName: member.displayName,
      email: member.email,
      createdAt: new Date().toISOString(),
    }
    transaction.set(bookingRef, booking)
    transaction.set(statsRef, { booked: booked + 1, capacity: session.capacity }, { merge: true })
    logger.info('Booking created', { uid, sessionId: session.id })
    return { id: bookingRef.id, ...booking }
  })
})

exports.cancelBooking = onCall(async (request) => {
  const { uid } = requireAuth(request)
  const bookingRef = db.collection('bookings').doc(String(request.data?.bookingId ?? ''))

  return db.runTransaction(async (transaction) => {
    const booking = await transaction.get(bookingRef)
    if (!booking.exists) throw new HttpsError('not-found', 'That booking no longer exists.')
    if (booking.data().uid !== uid && (await getMember(uid)).role !== 'admin') {
      throw new HttpsError('permission-denied', 'You can only cancel your own bookings.')
    }
    const statsRef = db.collection('sessionStats').doc(booking.data().sessionId)
    const stats = await transaction.get(statsRef)
    transaction.delete(bookingRef)
    transaction.set(statsRef, { booked: Math.max(0, (stats.data()?.booked ?? 1) - 1) }, { merge: true })
    return { ok: true }
  })
})

// D.2 Email with an attachment
exports.sendEmail = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  const { uid } = requireAuth(request)
  const member = await getMember(uid)
  const subject = cleanText(request.data?.subject, 120)
  const message = cleanText(request.data?.message, 5000)
  const attachment = request.data?.attachment
  if (!subject || !message) throw new HttpsError('invalid-argument', 'Add a subject and a message.')

  // Members can only email themselves; administrators can email any address
  const to = member.role === 'admin' && request.data?.to ? cleanText(request.data.to, 160) : member.email

  const mail = { to, from: SENDGRID_FROM.value(), subject, text: message, html: emailBody(message) }
  if (attachment) {
    const content = String(attachment.content ?? '')
    if (!ATTACHMENT_TYPES.includes(attachment.type)) {
      throw new HttpsError('invalid-argument', 'That attachment type is not allowed.')
    }
    if (Buffer.byteLength(content, 'base64') > MAX_ATTACHMENT_BYTES) {
      throw new HttpsError('invalid-argument', 'Attachments must be smaller than 2 MB.')
    }
    mail.attachments = [{
      content,
      filename: cleanText(attachment.filename, 80).replace(/[^\w.-]/g, '_') || 'attachment',
      type: attachment.type,
      disposition: 'attachment',
    }]
  }

  useSendGrid()
  await sgMail.send(mail)
  logger.info('Email sent', { uid, to, attachment: Boolean(attachment) })
  return { ok: true, to }
})

// F.1 Bulk email to selected members (administrators only)
exports.sendBulkEmail = onCall({ secrets: [SENDGRID_API_KEY] }, async (request) => {
  await requireAdmin(request)
  const uids = [...new Set(Array.isArray(request.data?.uids) ? request.data.uids.map(String) : [])]
  const subject = cleanText(request.data?.subject, 120)
  const message = cleanText(request.data?.message, 5000)
  if (!uids.length || uids.length > 100) throw new HttpsError('invalid-argument', 'Select between 1 and 100 members.')
  if (!subject || !message) throw new HttpsError('invalid-argument', 'Add a subject and a message.')

  const refs = uids.map((uid) => db.collection('members').doc(uid))
  const recipients = (await db.getAll(...refs)).filter((doc) => doc.exists).map((doc) => doc.data().email)
  if (!recipients.length) throw new HttpsError('not-found', 'None of the selected members were found.')

  useSendGrid()
  // isMultiple sends a separate email to each person so addresses stay private
  await sgMail.send({
    to: recipients, from: SENDGRID_FROM.value(), subject, text: message, html: emailBody(message), isMultiple: true,
  })
  logger.info('Bulk email sent', { count: recipients.length })
  return { ok: true, sent: recipients.length }
})

// F.1 Public REST API - GET /api/sessions, /api/sessions/:id, /api/sites, /api/stats
async function sessionsWithAvailability() {
  const stats = await db.collection('sessionStats').get()
  const booked = Object.fromEntries(stats.docs.map((doc) => [doc.id, doc.data().booked ?? 0]))
  return sessions.map((session) => ({
    ...session,
    booked: booked[session.id] ?? 0,
    placesLeft: session.capacity - (booked[session.id] ?? 0),
  }))
}

exports.api = onRequest({ cors: false }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Only GET requests are supported.' })
      return
    }
    // Works both through the Hosting rewrite (/api/...) and the direct function URL
    const parts = req.path.replace(/^\/api/, '').split('/').filter(Boolean)
    res.set('Cache-Control', 'public, max-age=60')

    try {
      if (parts[0] === 'sessions' && parts.length === 1) {
        let list = await sessionsWithAvailability()
        if (req.query.type) list = list.filter((session) => session.type === req.query.type)
        if (req.query.upcoming === 'true') list = list.filter((session) => new Date(session.start) > new Date())
        res.json({ count: list.length, sessions: list })
      } else if (parts[0] === 'sessions' && parts.length === 2) {
        const session = (await sessionsWithAvailability()).find((item) => item.id === parts[1])
        if (!session) res.status(404).json({ error: 'Session not found.' })
        else res.json(session)
      } else if (parts[0] === 'sites' && parts.length === 1) {
        let list = sites
        if (req.query.suburb) list = list.filter((site) => site.suburb.toLowerCase() === String(req.query.suburb).toLowerCase())
        if (req.query.status) list = list.filter((site) => site.status === req.query.status)
        res.json({ count: list.length, sites: list })
      } else if (parts[0] === 'stats' && parts.length === 1) {
        const [members, bookings] = await Promise.all([
          db.collection('members').count().get(),
          db.collection('bookings').count().get(),
        ])
        res.json({
          members: members.data().count,
          bookings: bookings.data().count,
          sessions: sessions.length,
          sites: sites.length,
          treesPlanted: sites.reduce((sum, site) => sum + site.trees, 0),
        })
      } else {
        res.status(404).json({
          error: 'Unknown route.',
          routes: ['/api/sessions', '/api/sessions/:id', '/api/sites', '/api/stats'],
        })
      }
    } catch (error) {
      logger.error('API error', error)
      res.status(500).json({ error: 'Something went wrong.' })
    }
  })
})
