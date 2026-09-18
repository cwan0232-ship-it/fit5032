<script setup>
import { ref } from 'vue'
import { collection, addDoc } from 'firebase/firestore'
import db from '../Firebase/init'
import BookList from '../components/BookList.vue'

const isbn = ref(''),
  name = ref('')
const busy = ref(false),
  message = ref(''),
  error = ref(''),
  revision = ref(0)

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
  <BookList :revision="revision" />
</template>
