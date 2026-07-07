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
          <!-- 是否需要上帝 -->
          <el-checkbox
            v-model="createForm.hasGod"
            class="setting-checkbox"
            :disabled="createForm.enableGodPower"
          >
            需要<span class="highlight-text"> {{ GOD_NAME }} </span>
          </el-checkbox>
          <!-- 是否由上帝指派身份 -->
          <el-checkbox
            v-model="createForm.enableGodPower"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            由
            <span class="highlight-text">{{ GOD_NAME }}</span>
            指派身份
          </el-checkbox>
          <!-- 是否需要警长 -->
          <el-checkbox
            v-model="createForm.enableSheriff"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            评选<span class="highlight-text"> 警长 </span>
          </el-checkbox>
          <!-- 新增第三方阵营勾选框 -->
          <el-checkbox
            v-model="createForm.hasThird"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            包含<span class="highlight-text"> 第三方阵营 </span>
          </el-checkbox>
          <!-- 是否包含可自爆身份 -->
          <el-checkbox
            v-model="createForm.hasBoomRole"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            包含<span class="highlight-text"> 可自爆身份 </span>
          </el-checkbox>
          <!-- 多选身份选择器，仅勾选可自爆身份时显示 -->
          <el-select
            v-if="createForm.hasBoomRole"
            v-model="createForm.boomRoleList"
            multiple
            placeholder="选择本局允许自爆的身份"
            no-data-text="请先勾选身份"
            style="width: 100%; margin-top: 12px"
          >
            <!-- 只展示上方已勾选启用的身份 -->
            <el-option
              v-for="role in boomRoleOptions"
              :key="role.roleId"
              :label="role.name"
              :value="role.roleId"
            />
          </el-select>

          <!-- 是否包含可主动亮牌身份 -->
          <el-checkbox
            v-model="createForm.hasShowRole"
            class="setting-checkbox"
            style="margin-top: 12px"
          >
            包含<span class="highlight-text"> 可主动亮牌身份 </span>
          </el-checkbox>
          <!-- 多选身份选择器，仅勾选可亮牌身份时显示 -->
          <el-select
            v-if="createForm.hasShowRole"
            v-model="createForm.showRoleList"
            multiple
            placeholder="选择本局允许主动亮牌的身份"
            no-data-text="请先勾选身份"
            style="width: 100%; margin-top: 12px"
          >
            <!-- 只展示上方已勾选启用的身份 -->
            <el-option
              v-for="role in showRoleOptions"
              :key="role.roleId"
              :label="role.name"
              :value="role.roleId"
            />
          </el-select>
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
      // 对局设定表单
      createForm: {
        roles: {},
        adminPwd: "",
        roomPwd: "",
        hasThird: false,
        enableSheriff: false,
        hasGod: true,
        enableGodPower: false,
        hasBoomRole: false,
        boomRoleList: [],
        hasShowRole: false,
        showRoleList: [],
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
    boomRoleOptions() {
      return this.roleConfigList.filter((role) => {
        return this.createForm.roles[role.name]?.enabled;
      });
    },
    showRoleOptions() {
      return this.roleConfigList.filter((role) => {
        return this.createForm.roles[role.name]?.enabled;
      });
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.rebuildCreateForm();
        this.createForm.adminPwd = "";
        this.createForm.roomPwd = "";
        this.createForm.hasThird = false;
        this.createForm.enableSheriff = false;
        this.createForm.hasGod = true;
        this.createForm.enableGodPower = false;
        this.createForm.hasBoomRole = false;
        this.createForm.boomRoleList = [];
        this.createForm.hasShowRole = false;
        this.createForm.showRoleList = [];
      }
    },
    "createForm.enableGodPower"(val) {
      if (val) {
        // 开启上帝派牌 → 必须开启hasGod
        this.createForm.hasGod = true;
      }
    },
    // 监听hasGod，当enableGodPower为true时，禁止手动取消hasGod
    "createForm.hasGod"(newVal) {
      if (this.createForm.enableGodPower && newVal === false) {
        this.$message.warning(
          "开启上帝指派身份时，本局必须包含上帝角色，无法取消"
        );
        this.createForm.hasGod = true;
      }
    },
    "createForm.roles": {
      handler() {
        const validIds = this.boomRoleOptions.map((r) => r.roleId);
        this.createForm.boomRoleList = this.createForm.boomRoleList.filter(
          (id) => validIds.includes(id)
        );
        // 新增亮牌身份过滤
        const validShowIds = this.showRoleOptions.map((r) => r.roleId);
        this.createForm.showRoleList = this.createForm.showRoleList.filter(
          (id) => validShowIds.includes(id)
        );
      },
      deep: true,
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
      const {
        roles,
        adminPwd,
        roomPwd,
        hasThird,
        hasGod,
        enableGodPower,
        enableSheriff,
        hasBoomRole,
        boomRoleList,
        hasShowRole,
        showRoleList,
      } = this.createForm;
      // 新增强制校验：开启上帝派牌必须开启hasGod
      if (enableGodPower && !hasGod) {
        this.$message.error("若选择由上帝指派身份，对局必须包含上帝角色！");
        return;
      }
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

      // 校验自爆身份配置
      if (hasBoomRole) {
        if (!boomRoleList || boomRoleList.length === 0) {
          this.createLoading = false;
          this.$message.warning(
            "开启可自爆功能时，请至少选择一种允许自爆的身份！"
          );
          return;
        }
      }

      // 校验亮牌身份配置
      if (hasShowRole) {
        if (!showRoleList || showRoleList.length === 0) {
          this.createLoading = false;
          this.$message.warning(
            "开启主动亮牌功能时，请至少选择一种允许亮牌的身份！"
          );
          return;
        }
      }

      const godText = hasGod
        ? `· 本局需要${this.GOD_NAME}`
        : `· 本局无${this.GOD_NAME}`;
      const modeText = enableGodPower
        ? `· 身份派发方式：由${this.GOD_NAME}指派身份`
        : "· 身份派发方式：玩家自行抽取身份牌";
      const sheriffText = enableSheriff ? "· 本局需要评选警长" : "· 本局无警长";
      const thirdText = hasThird
        ? "· 本局包含第三方阵营"
        : "· 本局无第三方阵营";
      const boomText = hasBoomRole
        ? `· 本局允许自爆的身份：${boomRoleList
            .map(
              (id) => this.boomRoleOptions.find((r) => r.roleId === id)?.name
            )
            .filter(Boolean)
            .join("、")}`
        : "· 本局无可自爆的身份";
      const showText = hasShowRole
        ? `· 本局允许主动亮牌的身份：${showRoleList
            .map(
              (id) => this.showRoleOptions.find((r) => r.roleId === id)?.name
            )
            .filter(Boolean)
            .join("、")}`
        : "· 本局无可主动亮牌的身份";

      const htmlContent = `
    <div style="line-height: 1.8; text-align: left;">
      <div>即将创建对局，当前配置如下：</div>
      <br/>
      <div><strong>【身份列表】</strong></div>
      ${roleHtmlList.join("")}
      <div>· 总人数：${total}人</div>
      <br/>
      <div><strong>【附加设定】</strong></div>
      <div>${godText}</div>
      <div>${modeText}</div>
      <div>${sheriffText}</div>
      <div>${thirdText}</div>
      <div>${boomText}</div>
      <div>${showText}</div>
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
        enableGodPower: enableGodPower,
        roomPwd: roomPwd.trim(),
        hasThird: hasThird,
        hasGod: hasGod,
        enableSheriff: enableSheriff,
        hasBoomRole: hasBoomRole,
        boomRoleList: boomRoleList,
        hasShowRole: hasShowRole,
        showRoleList: showRoleList,
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