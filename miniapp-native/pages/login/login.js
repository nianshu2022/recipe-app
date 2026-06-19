const app = getApp()
const { showToast } = require('../../utils/util')

Page({
  data: {
    isRegister: false,
    email: '',
    password: '',
    nickname: ''
  },

  onEmailInput(e) { this.setData({ email: e.detail.value }) },
  onPasswordInput(e) { this.setData({ password: e.detail.value }) },
  onNicknameInput(e) { this.setData({ nickname: e.detail.value }) },
  onToggleMode() { this.setData({ isRegister: !this.data.isRegister }) },

  onSubmit() {
    const { email, password, nickname, isRegister } = this.data
    if (!email || !password) { showToast('请填写邮箱和密码'); return }
    if (isRegister && !nickname) { showToast('请填写昵称'); return }

    const userInfo = {
      id: 'user_' + Date.now(),
      email,
      nickname: nickname || email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    app.globalData.userInfo = userInfo
    app.saveUserInfo()
    showToast(isRegister ? '注册成功' : '登录成功')
    setTimeout(() => wx.navigateBack(), 1500)
  }
})
