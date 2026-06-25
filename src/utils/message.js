/*
 * @Author: YangRui
 * @Date: 2026-06-25 12:27:46
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-25 12:27:57
 * @Description: 请输入
 */
/**重置message，防止重复点击重复弹出message弹框 */
import {
    Message
} from 'element-ui';

let messageInstance = null;
const resetMessage = (options) => {
    if (messageInstance) {
        messageInstance.close()
    }
    messageInstance = Message(options)
};

['error', 'success', 'info', 'warning'].forEach(type => {
    resetMessage[type] = options => {
        if (typeof options === 'string') {
            options = {
                message: options
            }
        }
        options.type = type
        return resetMessage(options)
    }
})

export const message = resetMessage