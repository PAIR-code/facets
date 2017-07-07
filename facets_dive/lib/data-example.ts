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
 * @fileoverview Types for defining data objects.
 */

/**
 * Currently, the visualization knows how to process values that are primitive
 * types. In the future the data format may be more liberal, at which point this
 * type should be expanded.
 *
 * It reality, these may be null or undefined, or other types, and the
 * visualization should handle those gracefully, but it aids code readability to
 * be able to count on these as numbers or strings most of the time.
 */
export type DataFieldValue = number|string;

/**
 * A data object represents a single input example. It's an object with
 * key/value pairs representing one unit. A TFExample representing an image, for
 * example.
 *
 * To use a table analogy, an object of this type would be a singel row of data,
 * with each field being a column.
 */
export interface DataExample { [fieldName: string]: DataFieldValue; }
