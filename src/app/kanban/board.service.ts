import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { switchMap, map } from 'rxjs/operators';
import { Board, Task } from './board.model';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  constructor(private afAuth: AngularFireAuth, private db: AngularFirestore) { }

  /**
   * Creates a new board for the current user
   *
   * @memberof BoardService
   */
  async createBoard(data: Board) {
    const user = await this.afAuth.auth.currentUser;
    return this.db.collection('boards').add({
      ...data,
      uid: user.uid,
      tasks: [{
        description: 'Hello!',
        label: 'yellow'
      }]
    })
  }

  /**
   * Delete board
   *
   * @memberof BoardService
   */
  deleteBoard(boardId: string) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .delete();
  }

  /**
   * Updates the tasks on board
   *
   * @param {string} boardId
   * @param {Task[]} tasks
   * @memberof BoardService
   */
  updateTasks(boardId: string, tasks: Task[]) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({ tasks });
  }

  /**
   * Remove a specific task from the board
   *
   * @param {string} boardId
   * @param {Task} task
   * @memberof BoardService
   */
  removeTask(boardId: string, task: Task) {
    return this.db
      .collection('boards')
      .doc(boardId)
      .update({
        tasks: firebase.firestore.FieldValue.arrayRemove(task)
      })
  }

  /**
   * Get all boards owned by current user
   *
   * @memberof BoardService
   */
  getUserBoards() {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.db
            .collection<Board>('boards', ref =>
              ref.where('uid', '==', user.uid).orderBy('priority')
            )
            .valueChanges({ idField: 'id' })
        } else {
          return []
        }
      })
    )
  }

  /**
   * Run a batch write to change the priority of each board for sorting
   *
   * @param {Board[]} boards
   * @memberof BoardService
   */
  sortBoards(boards: Board[]) {
    const db = firebase.firestore();
    const batch = db.batch();
    const refs = boards.map(b => db.collection('boards').doc(b.id))
    refs.forEach((ref, idx) => batch.update(ref, { priority: idx }))
    batch.commit()
  }
}
