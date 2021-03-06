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

import { browser } from 'protractor';
import { Logger } from './logger';

const fs = require('fs');
const path = require('path');

export async function takeScreenshot(screenshotFilePath, fileName) {
    const pngData = await browser.takeScreenshot();
    const filenameWithExt = `${fileName}.png`;
    Logger.info('Taking screenshot: ', filenameWithExt);
    writeScreenShot(screenshotFilePath, pngData, filenameWithExt);
}

export function writeScreenShot(screenshotFilePath, data, filenameWithExt) {
    const fileWithPath = path.join(screenshotFilePath, filenameWithExt);
    const stream = fs.createWriteStream(fileWithPath);
    stream.write(new Buffer(data, 'base64'));
    stream.end();
}
