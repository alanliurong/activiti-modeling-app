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

import { Project, Pagination, Release} from 'ama-sdk';

export interface ReleasesSummaryEntities {
    [key: string]: Partial<Release>;
}

export interface ProjectSummaryEntities {
    [key: string]: Partial<Project>;
}

export interface DashboardState {
    projects: ProjectSummaryEntities;
    loading: boolean;
    projectsLoaded: boolean;
    pagination: Pagination;
    releases: ReleasesSummaryEntities;
    loadingReleases: boolean;
    releasesPagination: Pagination;
}

export const INITIAL_DASHBOARD_STATE: DashboardState = {
    projects: {},
    pagination: null,
    loading: false,
    projectsLoaded: false,
    releases: {},
    loadingReleases: false,
    releasesPagination: null
};
