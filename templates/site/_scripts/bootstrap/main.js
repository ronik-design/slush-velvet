import 'babel-polyfill';
import objectFitImages from 'object-fit-images';
import svg4everybody from 'svg4everybody';
import {ready} from 'vanillajs-dom';

import jquery from 'jquery';

global.jQuery = jquery;

import 'bootstrap';

ready(() => {
  svg4everybody();
  objectFitImages();
});
