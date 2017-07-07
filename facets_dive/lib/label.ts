/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Types and methods related to rendering labels.
 */
import {Key} from './sorting';

/**
 * The content of a label includes the string to display and whether or not this
 * label should have special style to indicate that it's a strange value. For
 * example, NaN, undefined, or "other" might be special values in different
 * contexts.
 */
export interface LabelContent {
  /**
   * String content of this label.
   */
  label: string;

  /**
   * Whether this label should be rendered with special style.
   */
  special?: boolean;
}

/**
 * A labeling function takes a sorting/faceting key and returns the label
 * content to display.
 */
export type LabelingFunction = (key: Key) => LabelContent;
