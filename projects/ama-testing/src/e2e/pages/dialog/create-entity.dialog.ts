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

import { element, by } from 'protractor';
import { UtilRandom } from '../../util/random';
import { GenericDialog } from '../common/generic.dialog';
import { BrowserVisibility, BrowserActions } from '@alfresco/adf-testing';

export interface CreatedEntity {
    name: string;
    description: string;
}

export class CreateEntityDialog extends GenericDialog {

    readonly nameField = element(by.css(`input[data-automation-id='name-field']`));
    readonly descriptionField = element(by.css(`textarea[data-automation-id='desc-field']`));
    readonly submitButton = element(by.css(`button[data-automation-id='submit-button']`));
    readonly error = element.all(by.css(`.mat-error`)).first();

    constructor() {
        super('Create new ITEM');
    }

    async submit(): Promise<void> {
        await BrowserActions.click(this.submitButton);
    }

    async setEntityName(entityName): Promise<void> {
        await BrowserActions.clearSendKeys(this.nameField, entityName);
    }

    async setEntityDescription(entityDescription): Promise<void> {
        await BrowserActions.clearSendKeys(this.descriptionField, entityDescription);
    }

    async setEntityDetails(
        /* cspell: disable-next-line */
        entityName: string = 'ama-qa-' + UtilRandom.generateString(5, '1234567890abcdfghjklmnpqrstvwxyz'),
        entityDescription: string = UtilRandom.generateString()): Promise<CreatedEntity> {
        await this.isDialogDisplayed();
        await this.setEntityName(entityName);
        await this.setEntityDescription(entityDescription);
        await this.submit();
        await this.isDialogDismissed();
        return {
            name: entityName,
            description: entityDescription
        };
    }

    async getErrorMessage(): Promise<string> {
        await BrowserVisibility.waitUntilElementIsVisible(this.error);
        return this.error.getText();
    }
}
