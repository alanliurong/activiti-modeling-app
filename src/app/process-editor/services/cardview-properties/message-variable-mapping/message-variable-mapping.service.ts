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

import { Injectable } from '@angular/core';
import { AmaState, ServiceParameterMappings, UpdateServiceParametersAction, selectSelectedProcess } from 'ama-sdk/src/public_api';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import moment from 'moment-es6';

@Injectable({
    providedIn: 'root'
})
export class MessageVariableMappingService {

    constructor(private store: Store<AmaState>) { }

    updateMessagePayloadMapping(elementId, mapping) {
        const parameterMapping = <ServiceParameterMappings>mapping;
        this.store.select(selectSelectedProcess).pipe(
            filter((process) => !!process),
            take(1)
        ).subscribe((process) => this.store.dispatch(new UpdateServiceParametersAction(process.id, elementId, parameterMapping)));
    }

    getPropertyType(property: any): string {
        let type: string;

        if (typeof property.value === 'number') {
            type = 'integer';
        } else if (typeof property.value === 'object') {
            type = 'json';
        } else if (typeof property.value === 'boolean') {
            type = 'boolean';
        } else if (moment(property.value, 'YYYY-MM-DD', true).isValid()) {
            type = 'date';
        } else {
            type = 'string';
        }

        return type;
    }


}
