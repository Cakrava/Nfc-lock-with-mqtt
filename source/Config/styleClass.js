import style from './style';

export const styleClass = (classes) => {
  return classes
    .split(' ') // Pecah string berdasarkan spasi
    .map((cls) => style[cls] || {}) // Ambil gaya dari objek style
    .reduce((acc, curr) => ({ ...acc, ...curr }), {}); // Gabungkan gaya
};
