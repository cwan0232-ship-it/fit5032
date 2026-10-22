<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import db from '../Firebase/init'
import { session } from '../stores/auth'

const props = defineProps({ revision: { type: Number, default: 0 } })
const books = ref([]),
  mode = ref('above1000'),
  loading = ref(false)
const message = ref(''),
  error = ref(''),
  editing = ref(null),
  pendingDelete = ref(null)
const draft = ref({ name: '', isbn: 0 })

async function loadBooks() {
  loading.value = true
  error.value = ''
  try {
    const source = collection(db, 'books')
    const queries = {
      above1000: query(source, where('isbn', '>', 1000)),
      ordered: query(source, orderBy('isbn', 'desc')),
      limited: query(
        source,
        where('isbn', '>', 1000),
        orderBy('isbn', 'asc'),
        limit(2),
      ),
      all: query(source, orderBy('isbn', 'asc')),
    }
    const snapshot = await getDocs(queries[mode.value])
    books.value = snapshot.docs.map((record) => ({
      id: record.id,
      ...record.data(),
    }))
    console.info('Firestore query:', mode.value, 'Results:', books.value)
  } catch (e) {
    error.value = e.code || e.message
  } finally {
    loading.value = false
  }
}

function startEdit(book) {
  editing.value = book.id
  draft.value = { name: book.name, isbn: book.isbn }
}

async function saveBook(id) {
  error.value = message.value = ''
  try {
    const data = {
      name: draft.value.name.trim(),
      isbn: Number(draft.value.isbn),
    }
    if (!data.name || !Number.isSafeInteger(data.isbn) || data.isbn < 1)
      throw new Error('Enter valid book details.')
    await updateDoc(doc(db, 'books', id), data)
    message.value = `Updated “${data.name}” (ISBN ${data.isbn}).`
    console.info('Book updated:', { id, ...data })
    editing.value = null
    await loadBooks()
  } catch (e) {
    error.value = e.code || e.message
  }
}

async function removeBook(book) {
  error.value = message.value = ''
  try {
    await deleteDoc(doc(db, 'books', book.id))
    message.value = `Deleted “${book.name}” (ISBN ${book.isbn}).`
    console.info('Book deleted:', {
      id: book.id,
      name: book.name,
      isbn: book.isbn,
    })
    pendingDelete.value = null
    await loadBooks()
  } catch (e) {
    error.value = e.code || e.message
  }
}

watch(() => props.revision, loadBooks)
onMounted(loadBooks)
</script>

<template>
  <section class="catalogue">
    <div class="section-heading">
      <h2>Book collection</h2>
      <span>{{ books.length }} results</span>
    </div>
    <div class="filters">
      <label for="query-mode">Browse</label>
      <select id="query-mode" v-model="mode" @change="loadBooks">
        <option value="above1000">ISBN above 1000</option>
        <option value="ordered">ISBN highest first</option>
        <option value="limited">First 2 books above ISBN 1000</option>
        <option value="all">All books · ISBN lowest first</option>
      </select>
      <button class="secondary" :disabled="loading" @click="loadBooks">
        Refresh
      </button>
    </div>
    <p v-if="message" class="success" role="status">{{ message }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="loading" role="status">Loading books…</p>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ISBN</th>
            <th>Book name</th>
            <th v-if="session.role === 'librarian'">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in books" :key="book.id">
            <template v-if="editing === book.id">
              <td>
                <input
                  v-model.number="draft.isbn"
                  aria-label="Edit ISBN"
                  type="number"
                  min="1"
                />
              </td>
              <td>
                <input
                  v-model="draft.name"
                  aria-label="Edit book name"
                  maxlength="120"
                />
              </td>
              <td class="actions">
                <button @click="saveBook(book.id)">Save</button
                ><button class="secondary" @click="editing = null">
                  Cancel
                </button>
              </td>
            </template>
            <template v-else>
              <td>{{ book.isbn }}</td>
              <td>{{ book.name }}</td>
              <td v-if="session.role === 'librarian'" class="actions">
                <template v-if="pendingDelete === book.id"
                  ><span>Delete this book?</span
                  ><button class="danger" @click="removeBook(book)">
                    Confirm delete</button
                  ><button class="secondary" @click="pendingDelete = null">
                    Cancel
                  </button></template
                >
                <template v-else
                  ><button class="secondary" @click="startEdit(book)">
                    Edit</button
                  ><button class="text-button" @click="pendingDelete = book.id">
                    Delete
                  </button></template
                >
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      <p v-if="!books.length" class="empty">No books match this selection.</p>
    </div>
  </section>
</template>
