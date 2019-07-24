# Copyright 2018 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from os import path
from setuptools import setup

package_dir = path.abspath(path.dirname(__file__))
with open(path.join(package_dir, 'README.md')) as f:
    long_description = f.read()

setup(name='facets-overview',
      version='1.0.0',
      description='Python code to support the Facets Overview visualization',
      long_description=long_description,
      long_description_content_type='text/markdown',
      url='http://github.com/pair-code/facets',
      author='Google Inc.',
      author_email='opensource@google.com',
      license='Apache 2.0',
      packages=['facets_overview'],
      install_requires= [
          'numpy>=1.16.0',
          'pandas>=0.22.0',
          'protobuf>=3.7.0',
      ])
