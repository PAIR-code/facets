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
import {BoundedObject} from '../bounded-object';

const {expect} = chai;

describe('BoundingBox', () => {

  describe('shouldBeVisible', () => {

    it('should compare minScale first', () => {
      // When the bounded object has a minScale, then it should always be
      // visible except when the current scale of the visualization is less
      // than that, AND the object is not set to scale itself down to fit.
      const boundedObject = new BoundedObject();
      boundedObject.minScale = 2;

      boundedObject.scaleDown = true;
      // scale > minScale.
      expect(boundedObject.shouldBeVisible(null!, 3, null!, null!))
          .to.equal(true);
      // scale < minScale.
      expect(boundedObject.shouldBeVisible(null!, 1, null!, null!))
          .to.equal(true);

      boundedObject.scaleDown = false;
      // scale > minScale.
      expect(boundedObject.shouldBeVisible(null!, 3, null!, null!))
          .to.equal(true);
      // scale < minScale.
      expect(boundedObject.shouldBeVisible(null!, 1, null!, null!))
          .to.equal(false);
    });

    it('should return true when there is no minScale or bounding box', () => {
      const boundedObject = new BoundedObject();
      expect(boundedObject.shouldBeVisible(null!, 3, null!, null!))
          .to.equal(true);
    });

    it('should return false if the bounding box is outside the frustum', () => {
      //
      //             +------------------+
      //    +---+    |                  |
      //    |box|    |     frustum      |
      //    +---+    |                  |
      //             @------------------+
      //          camera
      //         position
      //
      const boundedObject = new BoundedObject();
      boundedObject.boundingBox = {
        left: 0,
        right: 2,
        bottom: 1,
        top: 3,
      };

      // Here we're placing the camera's bounds to the right and up, with
      // the camera's position is in the lower-left. This orientation of
      // the frustum relative to the camera is arbitrary.
      const cameraPosition = {x: 3, y: 0};
      const cameraBounds = {
        left: 0,
        right: 10,
        bottom: 0,
        top: 5,
      };

      const result =
          boundedObject.shouldBeVisible(null!, 3, cameraPosition, cameraBounds);
      expect(result).to.equal(false);

    });

    it('should return true when object fits inside bounding box at scale',
       () => {
         //
         //        +---------------------+
         //        |  +---+              |
         //        |  |box|   frustum    |
         //        |  +---+              |
         //        @---------------------+
         //      camera
         //     position
         //
         const boundedObject = new BoundedObject();
         boundedObject.width = 1;
         boundedObject.height = 1;
         boundedObject.boundingBox = {
           left: 2,
           right: 3,
           bottom: 1,
           top: 3,
         };

         // Using a scale of 1 means that pixels and world coordinates are
         // the same.
         const scale = 1;

         // Here we're placing the camera's bounds to the right and up, with
         // the camera's position is in the lower-left. This orientation of
         // the frustum relative to the camera is arbitrary.
         const cameraPosition = {x: 0, y: 0};
         const cameraBounds = {
           left: 0,
           right: 10,
           bottom: 0,
           top: 5,
         };

         const result = boundedObject.shouldBeVisible(
             null!, scale, cameraPosition, cameraBounds);
         expect(result).to.equal(true);

       });

    it('should return false when object exceeds bounding box at scale', () => {
      //
      //        +---------------------+
      //        |  +---+              |
      //        |  |box|   frustum    |
      //        |  +---+              |
      //        @---------------------+
      //      camera
      //     position
      //
      const boundedObject = new BoundedObject();
      boundedObject.width = 10;
      boundedObject.height = 10;
      boundedObject.boundingBox = {
        left: 2,
        right: 3,
        bottom: 1,
        top: 3,
      };

      // Using a scale of 1 means that pixels and world coordinates are
      // the same.
      const scale = 1;

      // Here we're placing the camera's bounds to the right and up, with
      // the camera's position is in the lower-left. This orientation of
      // the frustum relative to the camera is arbitrary.
      const cameraPosition = {x: 0, y: 0};
      const cameraBounds = {
        left: 0,
        right: 10,
        bottom: 0,
        top: 5,
      };

      const result = boundedObject.shouldBeVisible(
          null!, scale, cameraPosition, cameraBounds);
      expect(result).to.equal(false);
    });

  });

});
