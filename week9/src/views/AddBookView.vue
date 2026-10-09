<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { collection, addDoc, onSnapshot } from 'firebase/firestore'
import db from '../Firebase/init'
import BookList from '../components/BookList.vue'

const isbn = ref(''),
  name = ref('')
const busy = ref(false),
  message = ref(''),
  error = ref(''),
  revision = ref(0)
// Task 9.2 - compare what was submitted with what the Function stored
const submitted = ref(null),
  stored = ref(null)
let stopWatching = null

function watchBook(ref) {
  stopWatching?.()
  stored.value = null
  stopWatching = onSnapshot(ref, (snapshot) => {
    stored.value = snapshot.data()
    if (stored.value?.name === stored.value?.name?.toUpperCase()) {
      console.info('Capitalised by Cloud Function:', stored.value)
      revision.value++
    }
  })
}
onBeforeUnmount(() => stopWatching?.())

async function addBook() {
  busy.value = true
  error.value = message.value = ''
  try {
    const number = Number(isbn.value)
    if (!Number.isSafeInteger(number) || number < 1 || !name.value.trim()) {
      throw new Error('Enter a positive whole ISBN and a book name.')
    }
    const book = { isbn: number, name: name.value.trim() }
    const record = await addDoc(collection(db, 'books'), book)
    message.value = `Added “${book.name}” (ISBN ${book.isbn}).`
    console.info('Book added:', { id: record.id, ...book })
    submitted.value = book
    watchBook(record)
    revision.value++
    isbn.value = name.value = ''
  } catch (e) {
    error.value = e.code || e.message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <p class="eyebrow">LIBRARIAN WORKSPACE</p>
  <h1>Add a book</h1>
  <p>Grow the collection, one good read at a time.</p>
  <form class="add-form panel" @submit.prevent="addBook">
    <div>
      <label for="isbn">ISBN</label
      ><input
        id="isbn"
        v-model.number="isbn"
        type="number"
        min="1"
        step="1"
        max="9007199254740991"
        required
      />
    </div>
    <div>
      <label for="book-name">Book name</label
      ><input id="book-name" v-model="name" required maxlength="120" />
    </div>
    <button :disabled="busy">{{ busy ? 'Saving…' : 'Add book' }}</button>
  </form>
  <p v-if="message" class="success" role="status">{{ message }}</p>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <section v-if="submitted" class="panel capitalise-check">
    <h2>Cloud Function result</h2>
    <table>
      <thead>
        <tr><th></th><th>ISBN</th><th>Book name</th></tr>
      </thead>
      <tbody>
        <tr>
          <th>Submitted from browser</th>
          <td>{{ submitted.isbn }}</td>
          <td>{{ submitted.name }}</td>
        </tr>
        <tr>
          <th>Stored in Firestore</th>
          <td>{{ stored?.isbn }}</td>
          <td>{{ stored?.name }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="stored && stored.name === stored.name.toUpperCase()" class="success">
      capitaliseBook Function capitalised the new entry.
    </p>
    <p v-else role="status">Waiting for the capitaliseBook Function…</p>
  </section>
  <BookList :revision="revision" />
</template>
