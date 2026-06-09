<!--
 * @Author: YangRui
 * @Date: 2026-06-09 20:32:47
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-09 22:17:19
 * @Description: 切换后端服务
-->
<template>
  <el-dialog
    title="切换后端服务"
    :visible.sync="dialogVisible"
    append-to-body
    :fullscreen="true"
    :show-close="false"
  >
    <el-form label-width="80px">
      <el-form-item label="选择服务">
        <el-select
          v-model="currentKey"
          placeholder="请选择服务"
          style="width: 100%"
        >
          <el-option
            v-for="key in Object.keys(serverList)"
            :key="key"
            :label="serverList[key].name"
            :value="key"
          >
            <span style="font-weight: bold">{{ serverList[key].name }}</span>
            <span style="color: #999; margin-left: 8px; font-size: 12px">{{
              serverList[key].desc
            }}</span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="confirm">确认切换</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { API_SERVERS } from "@/const.js";

export default {
  name: "SwitchServer",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      currentKey: API_SERVERS.default,
      serverList: API_SERVERS.list,
    };
  },
  computed: {
    // 用 computed 代理 visible，避免直接修改 props
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  watch: {
    visible(val) {
      if (val) {
        const saved =
          localStorage.getItem("werewolf_server") || API_SERVERS.default;
        this.currentKey = saved;
      }
    },
  },
  methods: {
    closeDialog() {
      this.dialogVisible = false;
    },
    confirm() {
      const api = this.serverList[this.currentKey].url;
      localStorage.setItem("werewolf_server", this.currentKey);
      this.dialogVisible = false;
      this.$emit("change", api);
      this.$message.success("已切换：" + this.serverList[this.currentKey].name);
    },
  },
};
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>