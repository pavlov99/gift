import pkg from './package.json';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';


export default [
  {
    input: 'src/index.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: pkg.name
    },
    plugins: [
      buble({
        exclude: ['node_modules/**']
      }),
      uglify({
        "keep_classnames": true
      })
    ]
  }, {
    input: 'src/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: [
      buble({
        exclude: ['node_modules/**']
      })
    ]
  }
]
