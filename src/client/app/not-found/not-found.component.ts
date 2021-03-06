import { QuillEditorComponent } from './../shared/quill-editor/quill-editor.component'
import { ActivatedRoute, Router } from '@angular/router'
import { FirebaseDatabaseService } from './../shared/services/firebase-database.service'
import { AuthService } from './../shared/services/auth.service'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ServerResponseService } from './../shared/services/server-response.service'
import { ChangeDetectionStrategy, Component, HostBinding, ViewChild } from '@angular/core'
import { Observable } from 'rxjs/Observable'
import { SEONode, SEOService } from '../shared/services/seo.service'
import { MatDialog, MatSnackBar } from '@angular/material'
import { ModalConfirmationComponent } from '../shared/modal-confirmation/modal-confirmation.component'
// tslint:disable-next-line:no-require-imports
import ms = require('ms')

export interface Page {
  content: string
  title: string
  isDraft: boolean
  userCommentsEnabled?: boolean
  cache: { [key: string]: boolean | string | number }
}

@Component({
  selector: 'pm-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {
  @HostBinding('class.vert-flex-fill') flexFill = true
  @ViewChild(QuillEditorComponent) editor: QuillEditorComponent

  private isEditMode$ = this.ar.queryParams
    .map(a => a.edit ? true : false)
    .shareReplay()

  private url$ = Observable.of(this.router.url.split('?')[0])
    .filter(a => !a.includes('.'))
    .shareReplay()

  public settingsForm = new FormGroup({
    title: new FormControl('', [
      Validators.required
    ]),
    description: new FormControl('', [
      Validators.required
    ]),
    imgUrl: new FormControl('', [
      // Validators.required
    ]),
    userCommentsEnabled: new FormControl('', []),
    isDraft: new FormControl('', [])
  })

  public page$ = this.url$
    .flatMap(url => this.db
      .get<Page & SEONode>(`/pages/${url}`)
      .flatMap(page => this.isEditMode$, (page, editMode) => ({ page, editMode }))
      .map(res => {
        if (res && res.page && (res.editMode || !res.page.isDraft)) {
          if (!res.editMode) {
            const pageCacheSettings = res.page.cache
            const cacheControl = Object.keys(pageCacheSettings || {})
              .filter(key => pageCacheSettings[key])
              .reduce((acc, curr) => {
                const ret = typeof pageCacheSettings[curr] === 'boolean'
                  ? curr
                  : typeof pageCacheSettings[curr] === 'string'
                    ? `${curr}=${ms(pageCacheSettings[curr] as string) / 1000}`
                    : `${curr}=${pageCacheSettings[curr]}`

                return acc.concat(', ').concat(ret)
              }, '')
              .replace(/(^,)|(,$)/g, '')
              .trim()

            cacheControl
              ? this.rs.setHeader('Cache-Control', cacheControl)
              : this.rs.setCacheNone()
          } else {
            this.rs.setCacheNone()
          }

          return {
            ...res.page,
            content: res.page.content
          }
        }
        this.rs.setNotFound()
        this.rs.setCacheNone()
        return {
          ...res.page,
          content: 'not found'
        } as Page & SEONode
      })
      .do(page => {
        this.seo.updateNode({
          title: page.title,
          description: page.description,
          imgUrl: page.imgUrl
        })
        this.settingsForm.controls['title'].setValue(page.title)
        this.settingsForm.controls['description'].setValue(page.description)
        this.settingsForm.controls['imgUrl'].setValue(page.imgUrl)
        this.settingsForm.controls['userCommentsEnabled'].setValue(page.userCommentsEnabled)
        this.settingsForm.controls['isDraft'].setValue(page.isDraft)
      })
      .catch(err => {
        if (err.code === 'PERMISSION_DENIED') {
          this.rs.setStatus(401)
          return Observable.of({
            content: 'unauthorized'
          })
        } else {
          this.rs.setError()
          return Observable.of({
            content: 'server error'
          })
        }
      }))

  view$ = Observable.combineLatest(this.auth.user$, this.page$, this.ar.queryParams.pluck('edit').map(a => a === 'true'),
    (user, page, isEditing) => {
      return {
        canEdit: true, // for demo only, user && user.roles && user.roles.admin,
        isEditing,
        page
      }
    })
    .catch(err => {
      this.rs.setError()
      return Observable.of({
        content: 'server error'
      })
    })

  publish() {
    const settings = Object.keys(this.settingsForm.value)
      .filter(key => typeof this.settingsForm.value[key] !== 'undefined')
      .reduce((acc, curr) => {
        const obj = { ...acc } as any
        obj[curr] = this.settingsForm.value[curr]
        return obj
      }, {})

    this.url$.flatMap(url => this.db.getObjectRef(`/pages/${url}`)
      .update({
        ...settings,
        content: this.editor.textValue.getValue()
      }), (url, update) => ({ url, update }))
      .take(1)
      .subscribe(a => {
        this.router.navigate([a.url])
        this.showSnack('Published! Page is now live.')
      })
  }

  showSnack(message: string) {
    this.snackBar.open(message, 'dismiss', {
      duration: 2000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom'
    })
  }

  confirmDelete() {
    return this.dialog.open(ModalConfirmationComponent, {
      width: '460px',
      position: {
        top: '30px'
      },
      data: {
        message: 'Deleting this page will immediately remove it from the database and anyone reading it',
        title: 'Are you sure?'
      }
    })
  }

  delete() {
    this.confirmDelete()
      .afterClosed()
      .filter(Boolean)
      .flatMap(() => this.url$)
      .flatMap(url => this.db.getObjectRef(`/pages/${url}`).remove(), (url, update) => ({ url, update }))
      .take(1)
      .subscribe(a => {
        this.router.navigate(['/pages'])
        this.showSnack('Page removed!')
      })
  }

  viewCurrent() {
    this.url$.do(url => {
      this.router.navigate([url])
    }).take(1).subscribe()
  }

  edit() {
    this.url$.do(url => {
      this.router.navigate([url], { queryParams: { edit: true } })
    }).take(1).subscribe()
  }

  constructor(private rs: ServerResponseService, private db: FirebaseDatabaseService, private seo: SEOService,
    public auth: AuthService, private ar: ActivatedRoute, private router: Router, private dialog: MatDialog,
    private snackBar: MatSnackBar) {
  }
}
