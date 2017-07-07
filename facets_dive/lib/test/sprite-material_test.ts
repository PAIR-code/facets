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
import {SpriteMaterial} from '../sprite-material';

const {expect} = chai;

describe('SpriteMaterial', () => {

  it('should have properly named shader programs', () => {
    const spriteMaterial = new SpriteMaterial(null!, null!);
    expect(spriteMaterial.vertexShader)
        .to.include('#define SHADER_NAME SpriteMaterial');
    expect(spriteMaterial.fragmentShader)
        .to.include('#define SHADER_NAME SpriteMaterial');
  });

  it('should allow getting and setting of uniforms', () => {
    const spriteMaterial = new SpriteMaterial(null!, null!);
    expect(spriteMaterial.time).to.equal(0);
    expect(spriteMaterial.uniforms.time.value).to.equal(0);
    spriteMaterial.time = 1000;
    expect(spriteMaterial.time).to.equal(1000);
    expect(spriteMaterial.uniforms.time.value).to.equal(1000);
  });

  describe('applyEasing', () => {

    it('should ease in and out', () => {
      const spriteMaterial = new SpriteMaterial(null!, null!);

      // Cubic in/out easing.
      expect(spriteMaterial.applyEasing(0)).to.be.closeTo(0, 1e-3);
      expect(spriteMaterial.applyEasing(0.1)).to.be.closeTo(0.004, 1e-3);
      expect(spriteMaterial.applyEasing(0.2)).to.be.closeTo(0.032, 1e-3);
      expect(spriteMaterial.applyEasing(0.3)).to.be.closeTo(0.108, 1e-3);
      expect(spriteMaterial.applyEasing(0.4)).to.be.closeTo(0.256, 1e-3);
      expect(spriteMaterial.applyEasing(0.5)).to.be.closeTo(0.5, 1e-3);
      expect(spriteMaterial.applyEasing(0.6)).to.be.closeTo(0.744, 1e-3);
      expect(spriteMaterial.applyEasing(0.7)).to.be.closeTo(0.892, 1e-3);
      expect(spriteMaterial.applyEasing(0.8)).to.be.closeTo(0.968, 1e-3);
      expect(spriteMaterial.applyEasing(0.9)).to.be.closeTo(0.996, 1e-3);
      expect(spriteMaterial.applyEasing(1)).to.be.closeTo(1, 1e-3);
    });


  });

});
