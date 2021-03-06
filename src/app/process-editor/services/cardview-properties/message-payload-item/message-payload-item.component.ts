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

import { Component, Input, OnInit } from '@angular/core';
import { CardItemTypeService, MomentDateAdapter, LocalizedDatePipe } from '@alfresco/adf-core';
import { MatSelectChange, DateAdapter, MAT_DATE_FORMATS, MatDatepickerInputEvent } from '@angular/material';
import { Moment } from 'moment';
import { AmaState, selectSelectedProcess, MessagePayload, EntityProperty } from 'ama-sdk/src/public_api';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { MessageVariableMappingService } from '../message-variable-mapping/message-variable-mapping.service';
import { MessageItemModel } from '../message-item/message-item.model';

export const TYPE_OPTIONS = ['string', 'integer', 'boolean', 'date', 'variable'];
export const BOOLEAN_OPTIONS = [true, false];
export const MOMENT_DATE_FORMATS = {
    parse: {
        dateInput: 'YYYY-MM-DD',
    },
    display: {
        dateInput: 'YYYY-MM-DD',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

@Component({
    selector: 'ama-process-message-payload',
    templateUrl: './message-payload-item.component.html',
    providers: [
        CardItemTypeService,
        { provide: DateAdapter, useClass: MomentDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MOMENT_DATE_FORMATS },
    ]
})
export class CardViewMessagePayloadItemComponent implements OnInit {

    @Input() property: MessageItemModel;

    payloadProperties: MessagePayload[] = [];
    processVariables: EntityProperty[] = [];

    typeOptions = TYPE_OPTIONS;
    booleanOptions = BOOLEAN_OPTIONS;

    showPropertyForm: boolean;
    propertyName: string;
    propertyValue: string;
    selectedType: string;
    selectedProcessVariable: string;

    constructor(
        private localizedDatePipe: LocalizedDatePipe,
        private store: Store<AmaState>,
        private messageVariableMappingService: MessageVariableMappingService) { }

    private get elementId(): string {
        return this.property.data.id;
    }

    ngOnInit() {
        this.store.select(selectSelectedProcess).pipe(
            filter((process) => !!process),
            take(1)
        ).subscribe((process) => {
            this.processVariables = Object.values(process.extensions.properties);
            this.payloadProperties = this.parseMessagePayload(process.extensions.mappings);
        });
        this.resetForm();
    }

    addNewProperty() {
        this.showPropertyForm = true;
    }

    onTypeChanged(typeValue: MatSelectChange) {
        this.selectedType = typeValue.value;
    }

    onDateChanged(newDate: MatDatepickerInputEvent<Moment>) {
        this.propertyValue = this.localizedDatePipe.transform(newDate.value.toDate(), 'yyyy-MM-dd');
    }

    saveProperty() {
        const newProperty = {
            name: this.propertyName.replace(/ /g, ''),
            value: this.propertyValue || this.selectedProcessVariable,
            type: this.selectedType === 'variable' ? 'variable' : 'value'
        };
        const propertyIndex = this.payloadProperties.findIndex((property) => this.propertyName === property.name);

        if (propertyIndex > -1) {
            this.payloadProperties[propertyIndex] = newProperty;
        } else {
            this.payloadProperties.push(newProperty);
        }

        this.resetForm();
        this.updateMessagePayloadMapping();
    }

    isSaveButtonEnabled(): boolean {
        return !!this.propertyName && !!this.selectedType && (!!this.propertyValue || !!this.selectedProcessVariable);
    }

    deleteProperty(propertyIndex: number) {
        this.payloadProperties.splice(propertyIndex, 1);
        this.updateMessagePayloadMapping();
    }

    resetForm() {
        this.showPropertyForm = false;
        this.propertyName = '';
        this.propertyValue = '';
        this.selectedType = '';
    }

    updateMessagePayloadMapping() {
        this.messageVariableMappingService.updateMessagePayloadMapping(this.elementId, { inputs: this.getMessagePayload() });
    }

    getMessagePayload(): Object {
        const messagePayload = {};
        this.payloadProperties.forEach((payloadProperty) => {
            messagePayload[payloadProperty.name] = {
                type: payloadProperty.type,
                value: payloadProperty.value
            };
        });
        return messagePayload;
    }

    parseMessagePayload(messageMappings): MessagePayload[] {
        const messagePayload = [];
        const messagePayloadMappings = messageMappings[this.elementId] && messageMappings[this.elementId].inputs
            ? messageMappings[this.elementId].inputs : {};

        Object.keys(messagePayloadMappings).forEach((property) => {
            messagePayload.push({ ...messagePayloadMappings[property], name: property });
        });

        return messagePayload;
    }
}
