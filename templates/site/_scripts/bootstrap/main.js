import 'babel-polyfill';
import 'bootstrap';
import objectFitImages from 'object-fit-images';
import svg4everybody from 'svg4everybody';
import {ready} from 'vanillajs-dom';

ready(() => {
  svg4everybody();
  objectFitImages();
});
