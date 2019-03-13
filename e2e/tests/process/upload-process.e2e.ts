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

import { LoginPage, LoginPageImplementation } from '../../pages/login.page';
import { Resources } from '../../util/resources';
import { SnackBar } from '../../pages/snackbar';
import { Backend } from '../../api/api.interfaces';
import { getBackend } from '../../api/helpers';
import { NodeEntry } from 'alfresco-js-api-node';
import { testConfig } from '../../test.config';
import { AuthenticatedPage } from '../../pages/authenticated.page';
import { ProjectContentPage } from '../../pages/project-content.page';
import { SidebarActionMenu } from '../../pages/sidebar.menu';

const path = require('path');

describe('Upload process', () => {
    const adminUser = {
        user: testConfig.ama.user,
        password: testConfig.ama.password
    };

    const processDetails = {
        path: Resources.SIMPLE_PROCESS.file_location,
        name: Resources.SIMPLE_PROCESS.process_name
    };
    const absoluteFilePath = path.resolve(testConfig.main.rootPath + processDetails.path);

    const authenticatedPage = new AuthenticatedPage();
    const snackBar = new SnackBar();
    const sidebarActionMenu = new SidebarActionMenu();

    let backend: Backend;
    let project: NodeEntry;
    let loginPage: LoginPageImplementation;
    let projectContentPage: ProjectContentPage;

    beforeAll(async () => {
        backend = await getBackend().setUp();
        project = await backend.project.createAndWaitUntilAvailable();
    });

    beforeAll(async () => {
        loginPage = LoginPage.get();
        await loginPage.navigateTo();
        await loginPage.login(adminUser.user, adminUser.password);
        await authenticatedPage.isLoggedIn();
    });

    beforeEach(async () => {
        projectContentPage = new ProjectContentPage(project.entry.id);
        await projectContentPage.navigateTo();
    });

    it('1. [C286536] Upload/Import process using New dropdown', async () => {
        await sidebarActionMenu.importProcess(absoluteFilePath);
        expect(await snackBar.isUploadedSuccessfully('process')).toBe(true, 'Process upload snackbar should be displayed');
        expect(await projectContentPage.isModelInList('process', processDetails.name)).toBe(true, `Item '${processDetails.name}' was not found in the list.`);
    });

    it('2. [C291963] Upload/Import process using Import button', async () => {
        await projectContentPage.importModel('process', absoluteFilePath);
        expect(await snackBar.isUploadedSuccessfully('process')).toBe(true, 'Process upload snackbar should be displayed');
        expect(await projectContentPage.isModelInList('process', processDetails.name)).toBe(true, `Item '${processDetails.name}' was not found in the list.`);
    });

    afterEach(async () => {
        await backend.process.delete(await projectContentPage.getModelId());
    });

    afterAll(async () => {
        await backend.project.delete(project.entry.id);
        await backend.tearDown();
        await authenticatedPage.logout();
    });
});