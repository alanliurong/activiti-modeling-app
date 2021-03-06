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
import { Injectable } from '@angular/core';
import { LogService } from '@alfresco/adf-core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { tap, switchMap, catchError, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BaseEffects, Pagination, LogFactoryService, LogAction, FetchQueries, ServerSideSorting, ErrorResponse, SearchQuery } from 'ama-sdk';
import {
    GetProjectsAttemptAction,
    GET_PROJECTS_ATTEMPT,
    GetProjectsSuccessAction,
    CreateProjectSuccessAction,
    UpdateProjectAttemptAction,
    UPDATE_PROJECT_ATTEMPT,
    UpdateProjectSuccessAction,
    DeleteProjectAttemptAction,
    DELETE_PROJECT_ATTEMPT,
    DeleteProjectSuccessAction,
    ShowProjectsAction,
    SHOW_PROJECTS,
    UploadProjectAttemptAction,
    UPLOAD_PROJECT_ATTEMPT,
    UploadProjectSuccessAction,
    ReleaseProjectAttemptAction,
    RELEASE_PROJECT_ATTEMPT,
    ReleaseProjectSuccessAction,
    CREATE_PROJECT_SUCCESS
} from '../actions/projects';
import { Store } from '@ngrx/store';
import { AmaState, CreateProjectAttemptAction, CREATE_PROJECT_ATTEMPT, } from 'ama-sdk';
import { SnackbarErrorAction, SnackbarInfoAction } from 'ama-sdk';
import { selectProjectsLoaded, selectPagination } from '../selectors/dashboard.selectors';
import { EntityDialogForm } from 'ama-sdk';
import { GET_PROJECT_RELEASES_ATTEMPT, GetProjectReleasesAttemptAction, GetProjectReleasesSuccessAction } from '../actions/releases';
import { getProjectEditorLogInitiator } from '../../../project-editor/services/project-editor.constants';
import { SetLogHistoryVisibilityAction } from '../../../store/actions/app.actions';

@Injectable()
export class ProjectsEffects extends BaseEffects {
    constructor(
        private actions$: Actions,
        private dashboardService: DashboardService,
        private store: Store<AmaState>,
        logService: LogService,
        private logFactory: LogFactoryService,
        router: Router,
    ) {
        super(router, logService);
    }

    @Effect()
    showProjectsEffect = this.actions$.pipe(
        ofType<ShowProjectsAction>(SHOW_PROJECTS),
        withLatestFrom(this.store.select(selectProjectsLoaded)),
        switchMap(([action, loaded]) => loaded ? of() : of(new GetProjectsAttemptAction(<FetchQueries> action.pagination)))
    );

    @Effect()
    uploadProjectAttemptEffect = this.actions$.pipe(
        ofType<UploadProjectAttemptAction>(UPLOAD_PROJECT_ATTEMPT),
        map(action => action.file),
        switchMap(file => this.uploadProject(file))
    );

    @Effect()
    createProjectAttemptEffect = this.actions$.pipe(
        ofType<CreateProjectAttemptAction>(CREATE_PROJECT_ATTEMPT),
        map(action => action.payload),
        mergeMap(payload => this.createProject(payload))
    );

    @Effect()
    updateProjectAttemptEffect = this.actions$.pipe(
        ofType<UpdateProjectAttemptAction>(UPDATE_PROJECT_ATTEMPT),
        map(action => action.payload),
        mergeMap(payload => this.updateProject(payload.id, payload.form))
    );

    @Effect()
    deleteProjectAttemptEffect = this.actions$.pipe(
        ofType<DeleteProjectAttemptAction>(DELETE_PROJECT_ATTEMPT),
        map(action => action),
        withLatestFrom(this.store.select(selectPagination)),
        mergeMap(([action, pagination]) => this.deleteProject(action.projectId, action.sorting, action.search, pagination))
    );

    @Effect()
    getProjectsAttemptEffect = this.actions$.pipe(
        ofType<GetProjectsAttemptAction>(GET_PROJECTS_ATTEMPT),
        switchMap(action => this.getProjectsAttempt(<FetchQueries> action.pagination, action.sorting, action.search))
    );

    @Effect()
    getProjectReleasesAttemptEffect = this.actions$.pipe(
        ofType<GetProjectReleasesAttemptAction>(GET_PROJECT_RELEASES_ATTEMPT),
        switchMap(action => this.getProjectReleasesAttempt(action.projectId, action.pagination))
    );

    @Effect()
    releaseProjectAttemptEffect = this.actions$.pipe(
        ofType<ReleaseProjectAttemptAction>(RELEASE_PROJECT_ATTEMPT),
        mergeMap(action => this.releaseProject(action.projectId))
    );

    @Effect({ dispatch: false })
    createProjectSuccessEffect$ = this.actions$.pipe(
        ofType<CreateProjectSuccessAction>(CREATE_PROJECT_SUCCESS),
        tap((action) => this.router.navigate([ '/projects', action.payload.id]))
    );

    private deleteProject(projectId: string, sorting: ServerSideSorting, search: SearchQuery, pagination: Pagination) {
        return this.dashboardService.deleteProject(projectId).pipe(
            switchMap(() => [
                new DeleteProjectSuccessAction(projectId),
                new SnackbarInfoAction('APP.HOME.NEW_MENU.PROJECT_DELETED'),
                new GetProjectsAttemptAction({
                    skipCount: pagination.skipCount < (pagination.totalItems - 1) ? pagination.skipCount : pagination.skipCount - pagination.maxItems,
                    maxItems: pagination.maxItems
                }, {
                    key: sorting.key,
                    direction: sorting.direction}, search)
            ]),
            catchError(e =>
                this.genericErrorHandler(
                    () => of(new SnackbarErrorAction('APP.PROJECT.ERROR.DELETE_PROJECT')),
                    e
                )
            )
        );
    }

    private updateProject(projectId: string, form: Partial<EntityDialogForm>) {
        return this.dashboardService.updateProject(projectId, form).pipe(
            switchMap(project => [
                new UpdateProjectSuccessAction(project),
                new SnackbarInfoAction('APP.HOME.NEW_MENU.PROJECT_UPDATED')
            ]),
            catchError(e =>
                this.genericErrorHandler(this.handleProjectUpdateError.bind(this, e), e)
            )
        );
    }

    private releaseProject(projectId: string) {
        return this.dashboardService.releaseProject(projectId).pipe(
            switchMap(release => [
                new ReleaseProjectSuccessAction(release, projectId),
                this.logFactory.logInfo(getProjectEditorLogInitiator(), 'APP.HOME.NEW_MENU.PROJECT_RELEASED'),
                new SnackbarInfoAction('APP.HOME.NEW_MENU.PROJECT_RELEASED')
            ]),
            catchError(e => this.genericErrorHandler(this.handleProjectReleaseError.bind(this, e), e))
        );
    }

    private createProject(form: Partial<EntityDialogForm>) {
        return this.dashboardService.createProject(form).pipe(
            switchMap(project => [
                new CreateProjectSuccessAction(project),
                new SnackbarInfoAction('APP.HOME.NEW_MENU.PROJECT_CREATED')
            ]),
            catchError(e =>
                this.genericErrorHandler(this.handleProjectCreateError.bind(this, e), e)
            )
        );
    }

    private getProjectsAttempt(pagination: FetchQueries, sorting: ServerSideSorting, search: SearchQuery) {
        return this.dashboardService.fetchProjects(pagination, sorting, search).pipe(
            switchMap(projects => [new GetProjectsSuccessAction(projects)]),
            catchError(e => this.genericErrorHandler(this.handleError.bind(this, 'APP.HOME.ERROR.LOAD_PROJECTS'), e))
        );
    }

    private getProjectReleasesAttempt(projectId: string, pagination: Partial<Pagination>) {
        return  this.dashboardService.fetchProjectReleases(projectId, pagination).pipe(
            switchMap(releases => [new GetProjectReleasesSuccessAction(releases)]),
            catchError(e => this.genericErrorHandler(this.handleError.bind(this, 'APP.HOME.ERROR.LOAD_RELEASES'), e))
        );
    }

    private uploadProject(file: File) {
        return this.dashboardService.importProject(file).pipe(
            switchMap(project => [
                new UploadProjectSuccessAction(project),
                new SnackbarInfoAction('APP.HOME.NEW_MENU.PROJECT_UPLOADED')
            ]),
            catchError(e => this.genericErrorHandler(this.handleProjectUploadError.bind(this, e), e))
        );
    }

    private handleProjectCreateError(error: ErrorResponse): Observable<SnackbarErrorAction> {
        let errorMessage: string;

        if (error.status === 409) {
            errorMessage = 'APP.PROJECT.ERROR.CREATE_PROJECT.DUPLICATION';
        } else {
            errorMessage = 'APP.PROJECT.ERROR.CREATE_PROJECT.GENERAL';
        }

        return of(new SnackbarErrorAction(errorMessage));
    }

    private handleProjectUpdateError(error: ErrorResponse): Observable<SnackbarErrorAction> {
        let errorMessage: string;

        if (error.status === 409) {
            errorMessage = 'APP.PROJECT.ERROR.UPDATE_PROJECT.DUPLICATION';
        } else {
            errorMessage = 'APP.PROJECT.ERROR.UPDATE_PROJECT.GENERAL';
        }

        return of(new SnackbarErrorAction(errorMessage));
    }

    private handleProjectUploadError(error: ErrorResponse): Observable<SnackbarErrorAction> {
        let errorMessage: string;

        if (error.status === 409) {
            errorMessage = 'APP.PROJECT.ERROR.UPLOAD_PROJECT.DUPLICATION';
        } else {
            errorMessage = 'APP.PROJECT.ERROR.UPLOAD_PROJECT.GENERAL';
        }

        return of(new SnackbarErrorAction(errorMessage));
    }

    private handleProjectReleaseError(error: ErrorResponse): Observable<SnackbarErrorAction | SetLogHistoryVisibilityAction | LogAction> {

        const errorMessage = 'APP.PROJECT.ERROR.RELEASE_PROJECT';
        const errorLog = JSON.parse(error.message).errors.map((e: any) => e.description);

        return of(
            new SnackbarErrorAction(errorMessage),
            this.logFactory.logError(getProjectEditorLogInitiator(), errorLog),
            new SetLogHistoryVisibilityAction(true)
        );
    }

    private handleError(userMessage: string) {
        return of(new SnackbarErrorAction(userMessage));
    }
}
