<template>
  <el-dialog
    title="创建对局"
    :visible.sync="visibleLocal"
    :fullscreen="true"
    :show-close="false"
    @close="handleClose"
    class="full-screen-dialog"
  >
    <el-form label-width="100px">
      <!-- 第一步：选择身份 & 设置数量 -->
      <div class="form-section">
        <h3 class="section-title">1. 选择对局身份、设置对应数量</h3>
        <div
          v-for="role in roleConfigList"
          v-show="role.enabled"
          :key="role.name"
          class="role-item"
        >
          <div class="w-full flex-between role-row">
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
          <div class="role-desc">（{{ role.desc || "暂无描述" }}）</div>
        </div>
      </div>

      <!-- 第二步：游戏附加设定 -->
      <div class="form-section">
        <h3 class="section-title">2. 游戏附加设定</h3>
        <div class="setting-box">
          <el-checkbox v-model="enableGodPower" class="setting-checkbox">
            是否由
            <span class="highlight-text">{{ GOD_NAME }}</span>
            指派身份
          </el-checkbox>
        </div>
      </div>

      <!-- 第三步：管理员密码验证 -->
      <div class="form-section">
        <h3 class="section-title">3. 管理员权限验证</h3>
        <el-form-item label="管理员密码" :required="true">
          <el-input
            v-model="createForm.pwd"
            show-password
            placeholder="请输入管理员密码"
          />
        </el-form-item>
      </div>
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

    // 创建对局
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

      // 统计选中身份与总人数
      const gameRoles = {};
      let total = 0;
      const roleHtmlList = [];
      this.roleConfigList.forEach((item) => {
        const cfg = roles[item.name];
        if (cfg?.enabled) {
          gameRoles[item.name] = cfg.count;
          total += cfg.count;
          roleHtmlList.push(`<div>· ${item.name}：${cfg.count}人</div>`);
        }
      });

      if (total < 3) {
        this.createLoading = false;
        this.$message.warning("至少选择3个玩家身份");
        return;
      }

      // 派牌规则文案
      const modeText = this.enableGodPower
        ? `· 身份派发方式：由${this.GOD_NAME}指派身份`
        : "· 身份派发方式：玩家自行抽取身份牌";

      // HTML 排版内容
      const htmlContent = `
    <div style="line-height: 1.8; text-align: left;">
      <div>即将创建对局，当前配置如下：</div>
      <br/>
      <div><strong>【身份列表】</strong></div>
      ${roleHtmlList.join("")}
      <div>· 总人数：${total}人</div>
      <br/>
      <div><strong>【派牌规则】</strong></div>
      <div>${modeText}</div>
      <br/>
      <div>确认创建该对局吗？</div>
    </div>
  `;

      try {
        await this.$confirm(htmlContent, "创建确认", {
          confirmButtonText: "确认创建",
          cancelButtonText: "取消",
          type: "warning",
          closeOnClickModal: false,
          dangerouslyUseHTMLString: true,
          center: true,
          showClose: false,
        });
      } catch (err) {
        return;
      }

      this.createLoading = true;
      this.$emit("create", {
        gameRoles,
        enableGodPower: this.enableGodPower,
        createForm: this.createForm,
      });
      this.visibleLocal = false;
    },
  },
};
</script>

<style scoped>
/* 模块整体间距 */
.form-section {
  margin-bottom: 24px;
}

/* 步骤标题，引导层级 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 4px;
  border-left: 4px solid #1890ff;
}

/* 身份选项行 */
.role-item {
  margin-bottom: 20px;
}
.role-row {
  height: 30px;
  margin-bottom: 4px;
}
.role-desc {
  font-size: 14px;
  color: #666;
}

/* 游戏设定卡片 */
.setting-box {
  background: #f8f9fa;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
.setting-checkbox {
  font-size: 14px;
  font-weight: 500;
}

/* 高亮文字（上帝名称） */
.highlight-text {
  color: #1890ff;
  font-weight: bold;
}
</style>