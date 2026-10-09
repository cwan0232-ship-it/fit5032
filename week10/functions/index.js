// FIT5032 Week 9 - Cloud Functions
const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const logger = require('firebase-functions/logger')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })

admin.initializeApp()

// Task 9.1 - count the documents in the "books" collection
exports.countBooks = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const booksCollection = admin.firestore().collection('books')
      const snapshot = await booksCollection.get()
      const count = snapshot.size

      res.status(200).send({ count })
    } catch (error) {
      console.error('Error counting books:', error.message)
      res.status(500).send('Error counting books')
    }
  })
})

// Task 9.2 - capitalise every text field of a newly added book
// Firestore triggers must run in the same region as the database
exports.capitaliseBook = onDocumentCreated(
  { document: 'books/{bookId}', region: 'australia-southeast2' },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) return

    const original = snapshot.data()
    const capitalised = {}
    for (const [field, value] of Object.entries(original)) {
      if (typeof value === 'string' && value !== value.toUpperCase()) {
        capitalised[field] = value.toUpperCase()
      }
    }

    if (!Object.keys(capitalised).length) return
    logger.info('Capitalising book', {
      bookId: event.params.bookId,
      before: original,
      after: { ...original, ...capitalised },
    })
    await snapshot.ref.update(capitalised)
  },
)
