export default defineAppConfig({
  pages: [
    'pages/calendar/index',
    'pages/camera/index',
    'pages/feedback/index',
    'pages/privacy/index',
    'pages/reminder/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#5B8DEF',
    navigationBarTitleText: '术后恢复助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAFF'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#5B8DEF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/calendar/index',
        text: '恢复日历'
      },
      {
        pagePath: 'pages/camera/index',
        text: '拍照指引'
      },
      {
        pagePath: 'pages/feedback/index',
        text: '医生反馈'
      },
      {
        pagePath: 'pages/privacy/index',
        text: '隐私授权'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '复诊提醒'
      }
    ]
  }
})
