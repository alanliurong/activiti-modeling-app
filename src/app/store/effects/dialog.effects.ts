/*!
 * @license
 * Copyright 2019 Alfresco, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Effect, Actions, ofType } from '@ngrx/effects';
import { Injectable, RendererFactory2 } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import {
    OPEN_CONFIRM_DIALOG,
    OpenConfirmDialogAction,
    DialogService,
    ConfirmDialogData,
    EntityDialogComponent,
    LoadApplicationAction,
    MODELER_NAME_REGEX,
    CreateProjectAttemptAction,
    OPEN_DIALOG,
    OpenDialogAction,
    CLOSE_ALL_DIALOGS,
    CloseAllDialogsAction,
    OpenEntityDialogAction,
    OPEN_ENTITY_DIALOG,
    CreateProjectDialogAction,
    CREATE_PROJECT_DIALOG,
    IMPORT_PROJECT_DIALOG,
    ImportProjectDialogAction
} from 'ama-sdk';
import { Action, Store } from '@ngrx/store';
import { UploadProjectAttemptAction } from '../../dashboard/store/actions/projects';

@Injectable()
export class DialogEffects {
    private projectFileInput: HTMLInputElement;

    constructor(
        private store: Store<any>,
        private actions$: Actions,
        private dialogService: DialogService,
        rendererFactory: RendererFactory2
    ) {
        const renderer = rendererFactory.createRenderer(null, null);

        this.projectFileInput = renderer.createElement(
            'input'
        ) as HTMLInputElement;
        this.projectFileInput.classList.add('app-import-project');
        this.projectFileInput.type = 'file';
        this.projectFileInput.style.display = 'none';
        this.projectFileInput.setAttribute('multiple', '');
        this.projectFileInput.accept =
            'application/zip,application/x-zip,application/x-zip-compressed';
        this.projectFileInput.addEventListener('change', event =>
            this.importProject(event)
        );
        renderer.appendChild(document.body, this.projectFileInput);
    }

    @Effect({ dispatch: false })
    openDialog = this.actions$.pipe(
        ofType<OpenDialogAction<any>>(OPEN_DIALOG),
        map(action =>
            this.dialogService.openDialog(
                action.dialogContent,
                action.dialogConfig
            )
        )
    );

    @Effect({ dispatch: false })
    closeDialog = this.actions$.pipe(
        ofType<CloseAllDialogsAction>(CLOSE_ALL_DIALOGS),
        map(() => this.dialogService.closeAll())
    );

    @Effect()
    confirmDialogEffect = this.actions$.pipe(
        ofType<OpenConfirmDialogAction>(OPEN_CONFIRM_DIALOG),
        switchMap(action =>
            this.openConfirmDialog(
                action.payload.action,
                action.payload.dialogData
            )
        )
    );

    @Effect({ dispatch: false })
    openEntityDialogEffect = this.actions$.pipe(
        ofType<OpenEntityDialogAction>(OPEN_ENTITY_DIALOG),
        map(action => action.payload),
        map(data =>
            this.dialogService.openDialog(EntityDialogComponent, { data })
        )
    );

    @Effect()
    createProject$ = this.actions$.pipe(
        ofType<CreateProjectDialogAction>(CREATE_PROJECT_DIALOG),
        map(
            () =>
                new OpenEntityDialogAction({
                    title: 'APP.HOME.NEW_MENU.CREATE_PROJECT_TITLE',
                    nameField: 'APP.HOME.DIALOGS.PROJECT_NAME',
                    descriptionField: 'APP.HOME.DIALOGS.PROJECT_DESC',
                    action: CreateProjectAttemptAction,
                    allowedCharacters: {
                        regex: MODELER_NAME_REGEX,
                        error: 'APP.DIALOGS.ERROR.GENERAL_NAME_VALIDATION'
                    }
                })
        )
    );

    @Effect({ dispatch: false })
    importProject$ = this.actions$.pipe(
        ofType<ImportProjectDialogAction>(IMPORT_PROJECT_DIALOG),
        map(() => this.projectFileInput.click())
    );

    private openConfirmDialog(action: Action, dialogData: ConfirmDialogData) {
        return this.dialogService
            .confirm(dialogData, action)
            .pipe(
                switchMap(confirmation =>
                    confirmation
                        ? [new LoadApplicationAction(false), action]
                        : [new LoadApplicationAction(false)]
                )
            );
    }

    private importProject(event: any): void {
        const input = <HTMLInputElement>event.currentTarget;

        if (input && input.files && input.files.length > 0) {
            this.store.dispatch(new UploadProjectAttemptAction(input.files[0]));
            event.target.value = '';
        }
    }
}
