import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { db } from '@/utils/storage'
import { exportData, downloadBackup, pickAndImportData } from '@/utils/backup'
import { Icon } from '@/components/Icon'
import './index.scss'

interface Stats {
  recipes: number
  collections: number
  cookingRecords: number
}

export default function DataManagementPage() {
  const [stats, setStats] = useState<Stats>({ recipes: 0, collections: 0, cookingRecords: 0 })
  const [loading, setLoading] = useState(false)

  const loadStats = async () => {
    try {
      const [recipes, collections, cookingRecords] = await Promise.all([
        db.getAllRecipes(),
        db.getAllCollections(),
        db.getAllCookingRecords(),
      ])
      setStats({
        recipes: recipes.filter((r) => !r.deletedAt).length,
        collections: collections.filter((c) => !c.deletedAt).length,
        cookingRecords: cookingRecords.filter((r) => !r.deletedAt).length,
      })
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  useDidShow(() => {
    loadStats()
  })

  const handleExport = async () => {
    setLoading(true)
    try {
      const json = await exportData()
      downloadBackup(json)
    } catch {
      Taro.showToast({ title: '导出失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const result = await pickAndImportData()
      if (result.success) {
        Taro.showToast({ title: result.message, icon: 'success' })
        loadStats()
      } else {
        Taro.showToast({ title: result.message, icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '导入失败', icon: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleClearAll = () => {
    Taro.showModal({
      title: '危险操作',
      content: '这将清除所有本地数据，且无法恢复。确定要继续吗？',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '再次确认',
            content: '真的要清除所有数据吗？此操作不可撤销。',
            confirmColor: '#dc2626',
            success: (res2) => {
              if (res2.confirm) {
                try {
                  Taro.clearStorageSync()
                  setStats({ recipes: 0, collections: 0, cookingRecords: 0 })
                  Taro.showToast({ title: '数据已清除', icon: 'success' })
                } catch {
                  Taro.showToast({ title: '清除失败', icon: 'error' })
                }
              }
            },
          })
        }
      },
    })
  }

  return (
    <View className="data-page">
      {/* Header */}
      <View className="data-header">
        <View className="data-back" onClick={() => Taro.navigateBack()}>
          <Icon name="arrowLeft" size={40} color="#44403c" />
        </View>
        <Text className="data-title">数据管理</Text>
        <View className="data-spacer" />
      </View>

      {/* Stats cards */}
      <View className="stats-grid">
        <View className="stats-card">
          <Text className="stats-value">{stats.recipes}</Text>
          <Text className="stats-label">菜谱</Text>
        </View>
        <View className="stats-card">
          <Text className="stats-value">{stats.collections}</Text>
          <Text className="stats-label">收藏夹</Text>
        </View>
        <View className="stats-card">
          <Text className="stats-value">{stats.cookingRecords}</Text>
          <Text className="stats-label">做菜记录</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="action-section">
        <Text className="action-section-title">备份与恢复</Text>
        <View className="action-card">
          <View className="action-row" onClick={!loading ? handleExport : undefined}>
            <View className="action-info">
              <Text className="action-name">导出全部数据</Text>
              <Text className="action-desc">下载 JSON 备份文件</Text>
            </View>
            <View className="action-btn">
              <Text className="action-btn-text">导出</Text>
            </View>
          </View>
          <View className="action-divider" />
          <View className="action-row" onClick={!loading ? handleImport : undefined}>
            <View className="action-info">
              <Text className="action-name">导入数据</Text>
              <Text className="action-desc">从备份文件恢复数据</Text>
            </View>
            <View className="action-btn">
              <Text className="action-btn-text">导入</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Danger zone */}
      <View className="danger-section">
        <Text className="danger-section-title">危险操作</Text>
        <View className="danger-card">
          <View className="danger-info">
            <Text className="danger-name">清除所有数据</Text>
            <Text className="danger-desc">
              删除本地所有菜谱和记录
            </Text>
          </View>
          <View className="danger-btn" onClick={handleClearAll}>
            <Text className="danger-btn-text">清除</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
