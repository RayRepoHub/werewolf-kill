<template>
  <el-dialog
    title="创建对局"
    :visible.sync="visibleLocal"
    :fullscreen="true"
    :show-close="false"
    @close="handleClose"
  >
    <el-form label-width="100px">
      <div
        v-for="role in roleConfigList"
        v-show="role.enabled"
        :key="role.name"
        style="margin-bottom: 20px"
      >
        <div
          class="w-full flex-between"
          style="height: 30px; margin-bottom: 4px"
        >
          <el-checkbox v-model="createForm.roles[role.name].enabled">
            {{ role.name }}
          </el-checkbox>
          <el-input-number
            v-if="createForm.roles[role.name].enabled"
            v-model="createForm.roles[role.name].count"
            :min="1"
            size="mini"
          />
        </div>
        <div style="font-size: 14px">（{{ role.desc || "暂无描述" }}）</div>
      </div>
      <div
        style="
          background: #f8f9fa;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        "
      >
        <el-checkbox
          v-model="enableGodPower"
          style="font-size: 14px; font-weight: 500"
        >
          是否由
          <span style="color: #1890ff; font-weight: bold">{{ GOD_NAME }}</span>
          指派身份
        </el-checkbox>
      </div>
      <el-form-item label="管理员密码" :required="true">
        <el-input
          v-model="createForm.pwd"
          show-password
          placeholder="请输入管理员密码"
        />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visibleLocal = false">取 消</el-button>
      <el-button type="primary" @click="handleCreate" :loading="createLoading">
        创 建
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { ADMIN_PASSWORD, GOD_NAME } from "@/const.js";

export default {
  name: "CreateGameDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    roleConfigList: {
      type: Array,
      default: () => [],
    },
    localPlayer: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      GOD_NAME,
      ADMIN_PASSWORD,
      createLoading: false,
      enableGodPower: false,
      createForm: {
        roles: {},
        pwd: "",
      },
    };
  },
  computed: {
    // 用 computed 中转 visible，避免直接修改 prop
    visibleLocal: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  watch: {
    // 弹窗打开时重置表单、重建角色配置
    visible(val) {
      if (val) {
        this.rebuildCreateForm();
        this.createForm.pwd = "";
        this.enableGodPower = false;
      }
    },
  },
  methods: {
    // 关闭弹窗回调
    handleClose() {
      this.createLoading = false;
    },

    // 根据角色配置重建表单结构
    rebuildCreateForm() {
      const roles = {};
      this.roleConfigList.forEach((r) => {
        roles[r.name] = { enabled: false, count: 1 };
      });
      this.createForm.roles = roles;
    },

    // 点击创建对局，触发父组件事件
    async handleCreate() {
      const { roles, pwd } = this.createForm;
      if (!pwd?.trim()) {
        this.$message.error("请输入管理员密码！");
        return;
      }
      if (pwd !== this.ADMIN_PASSWORD) {
        this.$message.error("密码错误！");
        return;
      }

      this.createLoading = true;
      // 统计选中身份 & 总人数
      const gameRoles = {};
      let total = 0;
      this.roleConfigList.forEach((item) => {
        const cfg = roles[item.name];
        if (cfg?.enabled) {
          gameRoles[item.name] = cfg.count;
          total += cfg.count;
        }
      });

      if (total < 3) {
        this.createLoading = false;
        this.$message.warning("至少选择3个玩家身份");
        return;
      }

      // 抛出事件，把创建参数传给父组件
      this.$emit("create", {
        gameRoles,
        enableGodPower: this.enableGodPower,
        createForm: this.createForm,
      });
      // 创建成功后关闭弹窗
      this.visibleLocal = false;
    },
  },
};
</script>