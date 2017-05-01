export const CHANGE_TYPES = {
  NEXT: 'next',
  PLAY: 'play',
  PREV: 'prev',
  SHUFFLE: 'shuffle',
};

export const GENRES = [
  'Chill',
  'Trap',
  'Metal',
  'Dubstep',
  'Pop',
];

export const GENRES_MAP = GENRES.reduce((obj, genre) =>
  Object.assign({}, obj, {
    [genre]: 1,
  }), {});

export const IMAGE_SIZES = {
  LARGE: 't300x300',
  XLARGE: 't500x500',
};
