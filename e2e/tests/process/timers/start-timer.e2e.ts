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

import {testConfig} from '../../../test.config';
import {LoginPage} from 'ama-testing/e2e';
import {NodeEntry} from '@alfresco/js-api';
import {Backend} from 'ama-testing/e2e';
import {getBackend} from 'ama-testing/e2e';
import {AuthenticatedPage} from 'ama-testing/e2e';
import {ProcessContentPage} from 'ama-testing/e2e';
import {ProcessModelerComponent} from 'ama-testing/e2e';
import {TimerPropertiesCard} from 'ama-testing/e2e';

describe('Boundary Timer - Non-Interrupting', async () => {
    const adminUser = {
        user: testConfig.ama.user,
        password: testConfig.ama.password
    };

    const authenticatedPage = new AuthenticatedPage(testConfig);
    const processModelerComponent = new ProcessModelerComponent(testConfig);
    const timerProperties = new TimerPropertiesCard();

    let backend: Backend;
    let project: NodeEntry;
    let processContentPage: ProcessContentPage;

    beforeAll(async () => {
        backend = await getBackend(testConfig).setUp();
        project = await backend.project.create();

        const loginPage = LoginPage.get();
        await loginPage.navigateTo();
        await loginPage.login(adminUser.user, adminUser.password);
    });

    afterAll(async () => {
        await backend.project.delete(project.entry.id);
        await backend.tearDown();
        await authenticatedPage.logout();
    });

    it('[C311484] Create process with Start Timer - Cycle', async () => {
        const processFilePath = 'e2e/resources/process/timers/StartTimerCycle.bpmn20.xml';
        const cycleProcess = await backend.process.import(processFilePath, project.entry.id);

        processContentPage = new ProcessContentPage(testConfig, project.entry.id, cycleProcess.entry.id);
        await processContentPage.navigateTo();
        await expect(await processModelerComponent.isLoaded()).toBe(true, 'Process Modeler should be loaded');

        await processModelerComponent.selectStartEvent();
        await expect(await timerProperties.isLoaded()).toBe(true, 'Timer properties should be displayed');

        await expect(await timerProperties.getTimerType()).toBe('Cycle', 'Timer Type should be Cycle');

        await expect(await timerProperties.cyclePropertiesAreDisplayed()).toBe(true, 'Cycle properties should be displayed');
        await expect(await timerProperties.datePropertiesAreDisplayed()).toBe(true, 'Date property should be displayed');
        await expect(await timerProperties.durationPropertiesAreDisplayed()).toBe(true, 'Duration properties should be displayed');
    });

    it('[C311485] Create process with Start Timer - Date', async () => {
        const processFilePath = 'e2e/resources/process/timers/StartTimerDate.bpmn20.xml';
        const dateProcess = await backend.process.import(processFilePath, project.entry.id);

        processContentPage = new ProcessContentPage(testConfig, project.entry.id, dateProcess.entry.id);
        await processContentPage.navigateTo();
        await expect(await processModelerComponent.isLoaded()).toBe(true, 'Process Modeler should be loaded');

        await processModelerComponent.selectStartEvent();
        await expect(await timerProperties.isLoaded()).toBe(true, 'Timer properties should be displayed');

        await expect(await timerProperties.getTimerType()).toBe('Date', 'Timer Type should be Date');

        await expect(await timerProperties.datePropertiesAreDisplayed()).toBe(true, 'Date properties should be displayed');
    });

    it('[C311486] Create process with Start Timer - Duration', async () => {
        const processFilePath = 'e2e/resources/process/timers/StartTimerDuration.bpmn20.xml';
        const durationProcess = await backend.process.import(processFilePath, project.entry.id);

        processContentPage = new ProcessContentPage(testConfig, project.entry.id, durationProcess.entry.id);
        await processContentPage.navigateTo();
        await expect(await processModelerComponent.isLoaded()).toBe(true, 'Process Modeler should be loaded');

        await processModelerComponent.selectStartEvent();
        await expect(await timerProperties.isLoaded()).toBe(true, 'Timer properties should be displayed');

        await expect(await timerProperties.getTimerType()).toBe('Duration', 'Timer Type should be Duration');

        await expect(await timerProperties.durationPropertiesAreDisplayed()).toBe(true, 'Duration properties should be displayed');
    });
});
