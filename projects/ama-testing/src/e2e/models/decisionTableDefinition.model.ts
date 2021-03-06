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

import { DecisionModel } from './decision.model';

export class DecisionTableDefinitionModel {
    '_declaration' = {};
    'definitions' = {
        '_attributes' : {
            'xmlns': '',
            'id': '',
            'name': '',
            'namespace': '',
            'exporter': '',
            'exporterVersion': ''
        },
        'decision': new DecisionModel()
    };

    constructor(details?: any) {
        Object.assign(this['_declaration'], details[`_declaration`]);
        Object.assign(this['definitions']['_attributes'], details[`definitions`][`_attributes`]);
        this['definitions']['decision'] = details[`definitions`]['decision'] ? new DecisionModel(details[`definitions`]['decision']) : null;
    }

    getDecisionTableName() {
        return this['definitions']['_attributes']['name'];
    }

    setDecisionTableName(name) {
        this['definitions']['_attributes']['name'] = name;
    }

    setInputLabel(label: string) {
        this['definitions']['decision']['decisionTable']['input']['_attributes']['label'] = label;
    }

    setOutputLabel(label: string) {
        this['definitions']['decision']['decisionTable']['output']['_attributes']['label'] = label;
    }

    setOutputTypeRef(type: string) {
        this['definitions']['decision']['decisionTable']['output']['_attributes']['typeRef'] = type;
    }
}
