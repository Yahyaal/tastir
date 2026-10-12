/**
 * The proposed original look of every tutorial with a photo (#/plan/colors,
 * "Like the original"): what replaces its pattern's look, colours and
 * placements, with the palette picked from the photo. Written into the
 * tutorials once the owner agrees.
 */
export const ORIGINALS: Readonly<Record<string, Record<string, unknown>>> = {
  'alhambra-comares-dado': {
    look: 'tiles',
    colors: {
      octagon: 'ground',
      hexagon: 'c',
      square: 'a',
    },
    placements: {
      repeat: [1, 1],
      rules: [
        {
          piece: 'square',
          nth: 0,
          color: 'b',
        },
      ],
    },
    original: {
      palette: {
        a: '#2a272b',
        b: '#f2ede6',
        c: '#9a8064',
        d: '#3f5f8a',
        ground: '#e6dacb',
      },
      lines: '#d3c9bb',
    },
  },
  'alhambra-arrayanes-squares': {
    look: 'tiles',
    colors: {
      square: 'a',
      band: 'ground',
      star: 'b',
    },
    placements: {
      repeat: [6, 6],
      rules: [
        {
          piece: 'square',
          color: 'a',
        },
        {
          piece: 'square',
          cell: [0, 1],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [0, 3],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [0, 5],
          color: 'd',
        },
        {
          piece: 'square',
          cell: [1, 0],
          color: 'd',
        },
        {
          piece: 'square',
          cell: [1, 2],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [1, 4],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [2, 1],
          color: 'd',
        },
        {
          piece: 'square',
          cell: [2, 3],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [2, 5],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [3, 0],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [3, 2],
          color: 'd',
        },
        {
          piece: 'square',
          cell: [3, 4],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [4, 1],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [4, 3],
          color: 'd',
        },
        {
          piece: 'square',
          cell: [4, 5],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [5, 0],
          color: 'b',
        },
        {
          piece: 'square',
          cell: [5, 2],
          color: 'c',
        },
        {
          piece: 'square',
          cell: [5, 4],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [0, 1],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [0, 2],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [0, 4],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [0, 5],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [1, 0],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [1, 1],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [1, 3],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [1, 4],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [2, 0],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [2, 2],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [2, 3],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [2, 5],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [3, 1],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [3, 2],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [3, 4],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [3, 5],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [4, 0],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [4, 1],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [4, 3],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [4, 4],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [5, 0],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [5, 2],
          color: 'c',
        },
        {
          piece: 'star',
          cell: [5, 3],
          color: 'd',
        },
        {
          piece: 'star',
          cell: [5, 5],
          color: 'c',
        },
      ],
    },
    original: {
      palette: {
        a: '#2a241f',
        b: '#2c5a33',
        c: '#b5781c',
        d: '#3d6f93',
        ground: '#efebe3',
      },
      lines: '#c9b296',
    },
  },
  'alhambra-comares-bones': {
    look: 'tiles',
    colors: {
      bone: 'ground',
    },
    placements: {
      repeat: [2, 2],
      rules: [
        {
          piece: 'bone',
          turn: 90,
          cell: [0, 0],
          color: 'a',
        },
        {
          piece: 'bone',
          turn: 90,
          cell: [1, 1],
          color: 'a',
        },
        {
          piece: 'bone',
          turn: 90,
          cell: [1, 0],
          color: 'c',
        },
        {
          piece: 'bone',
          turn: 90,
          cell: [0, 1],
          color: 'b',
        },
      ],
    },
    original: {
      palette: {
        a: '#1f2129',
        b: '#2f8f8a',
        c: '#b17f35',
        d: '#3f5f8a',
        ground: '#efe9df',
      },
      lines: '#d8cfc4',
    },
  },
  'alhambra-comares-frames': {
    look: 'strapwork',
    colors: {
      teal_star: 'b',
      star: 'b',
      teal_piece: 'b',
      frame_corner: 'a',
      small_piece: 'b',
      diamond: 'b',
    },
    placements: {
      repeat: [1, 1],
      rules: [
        {
          piece: 'star',
          nth: 1,
          color: 'c',
        },
      ],
    },
    original: {
      palette: {
        a: '#222c2c',
        b: '#38646e',
        c: '#e8b15f',
        d: '#4f8070',
        ground: '#efe9df',
      },
      lines: '#7d7266',
      band: '#efe9df',
    },
  },
  'alhambra-leones-fret': {
    look: 'strapwork',
    colors: {
      fret: 'ground',
      star: 'c',
    },
    original: {
      palette: {
        a: '#6e4e40',
        b: '#e6e1d6',
        c: '#a8907e',
        d: '#c9bfae',
        ground: '#e6e1d6',
      },
      lines: '#6e4e40',
      band: '#e6e1d6',
      carved: true,
    },
  },
  'alhambra-reyes-fret': {
    look: 'tiles',
    colors: {
      bar: 'ground',
      cross: 'ground',
      fret: 'ground',
      small_cross: 'ground',
      diamond: 'ground',
    },
    original: {
      palette: {
        a: '#6e4e40',
        b: '#e6e1d6',
        c: '#d8d1c4',
        d: '#c9bfae',
        ground: '#e6e1d6',
      },
      lines: '#5e4a40',
      carved: true,
    },
  },
  'alhambra-reyes-stars': {
    look: 'tiles',
    colors: {
      star: 'ground',
      octagon: 'c',
      kite: 'b',
      cross: 'c',
      dart: 'd',
      small_kite: 'a',
    },
    placements: {
      repeat: [1, 1],
      rules: [
        {
          piece: 'kite',
          nth: 1,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 2,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 4,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 7,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 8,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 11,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 13,
          color: 'a',
        },
        {
          piece: 'kite',
          nth: 14,
          color: 'a',
        },
      ],
    },
    original: {
      palette: {
        a: '#3e3c3a',
        b: '#6c6cb1',
        c: '#d4b072',
        d: '#657981',
        ground: '#efe9df',
      },
      lines: '#cfc6b8',
    },
  },
  'alhambra-reyes-dodecagrams': {
    look: 'tiles',
    colors: {
      star: 'a',
      honey: 'c',
      blue: 'd',
      hexagon: 'ground',
      small_hexagon: 'ground',
      kite: 'ground',
    },
    original: {
      palette: {
        a: '#5e4545',
        b: '#5d7a63',
        c: '#dcae6a',
        d: '#8e90c9',
        ground: '#efe9df',
      },
      lines: '#d6cbbd',
    },
  },
  'alhambra-bath-stars': {
    look: 'strapwork',
    colors: {
      star: 'a',
      bar: 'b',
      cross_arm: 'd',
      small_star: 'c',
    },
    original: {
      palette: {
        a: '#3f342e',
        b: '#6b5a50',
        c: '#7a675c',
        d: '#4d413a',
        ground: '#5f4c42',
      },
      lines: '#2e2622',
      band: '#6e5a4f',
      carved: true,
    },
  },
  'alhambra-barca-stars': {
    look: 'strapwork',
    colors: {
      star: 'd',
      fork: 'a',
      bar: 'b',
      square: 'a',
    },
    palette: 'Alhambra',
  },
  'bou-inania-twelve-fold-wall': {
    look: 'strapwork',
    colors: {
      centre: 'b',
      arrowhead: 'a',
      cross: 'a',
      arrow: 'd',
      petal: 'a',
      cornerstar: 'b',
      shield: 'a',
      pentagon: 'c',
      arm: 'a',
      star: 'a',
      gap: 'ground',
      diamond: 'a',
      kite: 'a',
      chip: 'ground',
      ringbend: 'c',
      ringaxis: 'c',
    },
    original: {
      palette: {
        a: '#1e1a17',
        b: '#2e7f86',
        c: '#b98a4a',
        d: '#2f4f86',
        ground: '#efe9df',
      },
      lines: '#8b8072',
      band: '#efe9df',
    },
  },
  'eight-fold-star-and-octagon': {
    look: 'strapwork',
    colors: {
      star: 'a',
      corner_square: 'c',
      octagon_arm: 'b',
    },
    original: {
      palette: {
        a: '#a67c52',
        b: '#d9b26e',
        c: '#8e8a86',
        d: '#7a5c48',
        ground: '#e9e2d3',
      },
      lines: '#6d6058',
      band: '#ece6d8',
    },
  },
  'mian-stellated-rosettes': {
    look: 'strapwork',
    colors: {
      star: 'c',
      octagon: 'a',
      kite: 'b',
      ground: 'ground',
      ground2: 'ground',
      hexagon: 'd',
      petal: 'd',
      kite2: 'b',
    },
    original: {
      palette: {
        a: '#3a201e',
        b: '#6b4a45',
        c: '#8a6a5e',
        d: '#ddd3c8',
        ground: '#4a2a27',
      },
      lines: '#e6ddd0',
      band: '#6e4c46',
      carved: true,
    },
  },
  'minbar-doors-cairo': {
    look: 'strapwork',
    colors: {
      star: 'c',
      shield: 'a',
      triangle: 'd',
      kite: 'b',
    },
    original: {
      palette: {
        a: '#9c7b55',
        b: '#8a6a48',
        c: '#a8865c',
        d: '#6b4c32',
        ground: '#7d5e40',
      },
      lines: '#2e1a10',
      band: '#4e2f1e',
      carved: true,
    },
  },
};
