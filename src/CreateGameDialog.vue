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
            由
            <span class="highlight-text">{{ GOD_NAME }}</span>
            指派身份
          </el-checkbox>
          <!-- 新增第三方阵营勾选框 -->
          <el-checkbox
            v-model="createForm.hasThird"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            包含<span class="highlight-text"> 第三方阵营 </span>
          </el-checkbox>
          <el-checkbox
            v-model="createForm.hasGod"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            包含<span class="highlight-text"> {{ GOD_NAME }} </span>
          </el-checkbox>
        </div>
      </div>

      <!-- 第三步：密码设置 -->
      <div class="form-section">
        <h3 class="section-title">3. 密码设置</h3>
        <el-form-item label="管理员密码" required>
          <el-input
            v-model="createForm.adminPwd"
            show-password
            placeholder="请输入管理员密码"
          />
        </el-form-item>
        <el-form-item label="房间密码">
          <el-input
            v-model="createForm.roomPwd"
            show-password
            placeholder="选填，设置后加入对局需要验证密码"
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
      // 对局设定表单
      createForm: {
        roles: {},
        adminPwd: "",
        roomPwd: "",
        hasThird: false,
        hasGod: false,
      },
    };
  },
  computed: {
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
    visible(val) {
      if (val) {
        this.rebuildCreateForm();
        this.createForm.adminPwd = "";
        this.createForm.roomPwd = "";
        this.createForm.hasThird = false;
        this.createForm.hasGod = false;
        this.enableGodPower = false;
      }
    },
  },
  methods: {
    handleClose() {
      this.createLoading = false;
    },

    rebuildCreateForm() {
      const roles = {};
      this.roleConfigList.forEach((r) => {
        roles[r.name] = { enabled: false, count: 1 };
      });
      this.createForm.roles = roles;
    },

    async handleCreate() {
      const { roles, adminPwd, roomPwd, hasThird, hasGod } = this.createForm;
      // 校验管理员密码
      if (!adminPwd?.trim()) {
        this.$message.error("请输入管理员密码！");
        return;
      }
      if (adminPwd !== this.ADMIN_PASSWORD) {
        this.$message.error("管理员密码错误！");
        return;
      }

      // 统计身份与人数
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

      const modeText = this.enableGodPower
        ? `· 身份派发方式：由${this.GOD_NAME}指派身份`
        : "· 身份派发方式：玩家自行抽取身份牌";
      const thirdText = hasThird
        ? "· 本局包含第三方阵营"
        : "· 本局无第三方阵营";

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
      <div>${thirdText}</div>
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
      // 把对局设定表单数据一并传给父组件
      this.$emit("create", {
        gameRoles,
        enableGodPower: this.enableGodPower,
        roomPwd: roomPwd.trim(),
        hasThird: hasThird,
        hasGod: hasGod,
      });
      this.visibleLocal = false;
    },
  },
};
</script>

<style scoped>
.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 4px;
  border-left: 4px solid #1890ff;
}

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

.setting-box {
  background: #f8f9fa;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
.setting-checkbox {
  font-size: 14px;
  font-weight: 500;
  display: block;
}

.highlight-text {
  color: #1890ff;
  font-weight: bold;
}
</style>