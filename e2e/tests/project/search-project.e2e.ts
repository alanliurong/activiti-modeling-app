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

import { testConfig } from '../../test.config';
import { LoginPage, UtilRandom, getBackend, DashboardPage, LogHistoryPage, Logger } from 'ama-testing/e2e';
import { Backend } from 'ama-testing/e2e';
import { AuthenticatedPage } from 'ama-testing/e2e';
import { HeaderToolbar } from '../../pages/header.toolbar';
import { browser } from 'protractor';
import { Pagination } from 'ama-testing/e2e/pages/pagination.component';
import { NodeEntry } from '@alfresco/js-api';

describe('Search project', () => {
    const adminUser = {
        user: testConfig.ama.user,
        password: testConfig.ama.password
    };

    const authenticatedPage = new AuthenticatedPage(testConfig);
    const headerToolbar = new HeaderToolbar();
    const dashboardPage = new DashboardPage();
    const pagination = new Pagination();
    const logHistory = new LogHistoryPage();

    let project: NodeEntry;
    let backend: Backend;

    beforeAll(async () => {
        const loginPage = LoginPage.get();
        backend = await getBackend(testConfig).setUp();
        await loginPage.navigateTo();

        /* cspell: disable-next-line */
        project = await backend.project.create(`${browser.params.namePrefix}${UtilRandom.generateString(5, '1234567890abcdfghjklmnpqrstvwxyz')}`);
        await backend.process.create(project.entry.id);
        await loginPage.login(adminUser.user, adminUser.password);
    });

    beforeEach( async () => {
        await headerToolbar.clickOnAppIcon();
    });

    afterAll(async () => {
        try {
            await backend.project.delete(project.entry.id);
            await backend.tearDown();
            await authenticatedPage.logout();
        } catch (e) {
            Logger.error(`Cleaning up created project failed`);
            throw e;
        }
    });

    it('[C319173] Search results list should be reset when returning from the Releases list', async () => {
        const numberOfProjects = await dashboardPage.getProjectsCount();

        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);
        await headerToolbar.toggleSearch();
        await headerToolbar.writeSearchQuery(project.entry.name);
        await expect(await dashboardPage.isDashboardListDisplayed()).toBe(true);
        await expect( await dashboardPage.isProjectInPaginatedList(project.entry.id)).toBe(true);

        await dashboardPage.navigateToReleaseView(project.entry.id);
        await expect( await dashboardPage.isProjectReleaseEmpty()).toBe(true);

        await headerToolbar.clickOnAppIcon();
        const projects = await dashboardPage.getProjectsCount();
        await expect(projects).toEqual(numberOfProjects);
    });

    it('[C319172] Search results list should be reset when returning from Content Project page', async () => {
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);
        await headerToolbar.toggleSearch();
        await headerToolbar.writeSearchQuery(project.entry.name);
        await expect(await dashboardPage.isDashboardListDisplayed()).toBe(true);

        const numberOfProjects = await dashboardPage.getProjectsCount();
        await dashboardPage.navigateToProject(project.entry.id);
        await browser.navigate().back();

        await dashboardPage.isDashboardListDisplayed();
        const projects = await dashboardPage.getProjectsCount();
        await expect(projects).toEqual(numberOfProjects);
    });

    it('[C319171] Search results list should remain filtered on the browser refresh', async () => {
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);
        await headerToolbar.toggleSearch();
        await headerToolbar.writeSearchQuery(project.entry.name);
        await expect(await dashboardPage.isDashboardListDisplayed()).toBe(true);

        const numberOfProjects = await dashboardPage.getProjectsCount();
        await browser.refresh();

        const projects = await dashboardPage.getProjectsCount();
        await expect(projects).toEqual(numberOfProjects);

    });

    it('[C319169] Search by valid substring', async () => {
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);

        const paginationRange = await pagination.getPaginationRange();
        const numberOfProjects = await dashboardPage.getProjectsCount();

        await headerToolbar.toggleSearch();
        await expect(await headerToolbar.isSearchBarExpanded()).toBe(true);
        await headerToolbar.writeSearchQuery(project.entry.name);
        await expect(await dashboardPage.isDashboardListDisplayed()).toBe(true);

        await expect(await pagination.getPaginationRange()).not.toEqual(paginationRange);
        await expect(await headerToolbar.isSearchBarExpanded()).toBe(true);
        await headerToolbar.toggleSearch();
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);

        const projects = await dashboardPage.getProjectsCount();
        await expect(projects).toEqual(numberOfProjects);
    });

    it('[C319168] Search by special characters', async () => {
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);
        await headerToolbar.toggleSearch();
        await headerToolbar.writeSearchQuery('@$#*!^%$*');

        await expect(await dashboardPage.isDashboardListEmpty()).toEqual(true);
        await expect(await logHistory.isLogHistoryEmpty()).toEqual(true);
    });

    it('[C319167] Search by an existing project name', async () => {
        await expect(await headerToolbar.isSearchBarCollapsed()).toBe(true);
        await headerToolbar.toggleSearch();
        await headerToolbar.writeSearchQuery(project.entry.name);
        await expect(await dashboardPage.isDashboardListDisplayed()).toBe(true);

        const numberOfProjects = await dashboardPage.getProjectsCount();
        await expect(numberOfProjects).toEqual(1);
        await expect(await pagination.getPaginationRange()).toEqual('1 - 1 of 1');
    });
});
