import { MODEL_PORTFOLIOS, type BookEntry, type TaskStatus } from '../data/data'

/**
 * The model portfolio book, kept at module level so it survives going into the flow and back
 * (a page reload restores the sample list). The book screen edits it; Simulation closes tasks in it.
 */
let book: BookEntry[] = MODEL_PORTFOLIOS
export const getBook = () => book
export const setBook = (next: BookEntry[]) => { book = next; return next }
export const nextBookId = (l: BookEntry[]) => String(Math.max(0, ...l.map((e) => Number(e.id) || 0)) + 1).padStart(3, '0')
/** A task decision taken in Simulation is mirrored in the book. */
export const setBookTaskStatus = (id: string, rowId: string, status: TaskStatus) => {
  book = book.map((e) => (e.id === id && e.tasks ? { ...e, tasks: e.tasks.map((t) => (t.rowId === rowId ? { ...t, status } : t)) } : e))
}
