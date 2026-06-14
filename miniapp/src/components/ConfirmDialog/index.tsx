import { View, Text } from '@tarojs/components'
import { useUIStore } from '@/stores/uiStore'
import './index.scss'

export function ConfirmDialog() {
  const confirm = useUIStore((s) => s.confirm)
  const resolveConfirm = useUIStore((s) => s.resolveConfirm)

  if (!confirm.visible) return null

  return (
    <View className='confirm-overlay' onClick={() => resolveConfirm(false)}>
      <View className='confirm-dialog' onClick={(e) => e.stopPropagation()}>
        <Text className='confirm-dialog__title'>{confirm.title}</Text>
        <Text className='confirm-dialog__message'>{confirm.message}</Text>
        <View className='confirm-dialog__actions'>
          <View
            className='confirm-dialog__btn confirm-dialog__btn--cancel'
            onClick={() => resolveConfirm(false)}
          >
            <Text>{confirm.cancelText}</Text>
          </View>
          <View
            className={`confirm-dialog__btn ${confirm.danger ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--confirm'}`}
            onClick={() => resolveConfirm(true)}
          >
            <Text className='confirm-dialog__btn-text'>{confirm.confirmText}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
