import { ImageSourcePropType } from 'react-native';
import { img } from './api';

// The five bed photos are bundled inside the APK, so they show instantly and even offline.
// Any other image (seller uploads, tinted colour placeholders) is loaded from the server.
const BUNDLED: [string, ImageSourcePropType][] = [
  ['1505693416388-ac5ce068fe85', require('../assets/products/bed1.jpg')],
  ['1631049307264-da0ec9d70304', require('../assets/products/bed2.jpg')],
  ['1616594039964-ae9021a400a0', require('../assets/products/bed3.jpg')],
  ['1595526114035-0d45ed16cfbf', require('../assets/products/bed4.jpg')],
  ['1540518614846-7eded433c457', require('../assets/products/bed5.jpg')],
];

export function imgSrc(url?: string | null): ImageSourcePropType {
  if (url) {
    const hit = BUNDLED.find(([id]) => url.includes(id));
    if (hit) return hit[1];
  }
  return { uri: img(url) };
}
