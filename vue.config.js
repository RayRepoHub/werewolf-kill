/*
 * @Author: YangRui
 * @Date: 2026-05-21 21:47:42
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-14 19:51:23
 * @Description: 请输入
 */
const {
  defineConfig
} = require('@vue/cli-service')
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  // 想要项目运行后自动打开浏览器，可以配置如下
  devServer: {
    open: true, // 自动打开浏览器
    port: 8088 // 指定端口号
  },

  // 新增：SVG 图标配置
  chainWebpack(config) {
    // 排除默认svg解析，不走url-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/assets/icons'))
      .end()

    // 单独处理 assets/icons 下的svg，生成雪碧图
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/assets/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
  }
})