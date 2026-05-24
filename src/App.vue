<template>
  <div class="werewolf-game-container" v-loading="refreshLoading">
    <h2 class="text-center mb-4">狼人杀对局平台</h2>

    <div
      v-if="(!localPlayer.name || editingName) && !gameStatus.joined"
      class="mb-4"
      style="
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      "
    >
      <el-input
        v-model="tempName"
        placeholder="请输入你的名字"
        style="width: 300px"
      ></el-input>
      <el-button type="primary" @click="saveName">
        {{ editingName ? "保存" : "确认进入" }}
      </el-button>
      <el-button v-if="editingName" @click="cancelEditName"> 取消 </el-button>
    </div>

    <div
      v-else-if="localPlayer.name && !gameStatus.joined"
      style="text-align: center; margin-bottom: 16px"
    >
      <div style="font-size: 16px; margin-bottom: 10px">
        你好，<span style="color: #1890ff; font-weight: bold">{{
          localPlayer.name
        }}</span>
        <el-button
          type="text"
          icon="el-icon-edit"
          @click="editName"
          style="margin-left: 4px"
        >
        </el-button>
      </div>

      <div style="display: flex; justify-content: center; margin-top: 10px">
        <el-button type="success" @click="createGame"> 创建对局 </el-button>
        <el-button type="warning" @click="joinGame" style="margin-left: 10px">
          加入对局
        </el-button>
        <el-button type="info" @click="askGameSetting"> 对局设置 </el-button>
      </div>
    </div>

    <div v-if="showCreatePanel" class="mb-4" style="margin-top: 20px">
      <el-form label-width="100px">
        <div
          v-for="role in roleConfigList"
          v-show="role.enabled"
          :key="role.name"
          class="mb-3"
          style="margin-bottom: 30px; height: 30px"
        >
          <el-checkbox v-model="createForm.roles[role.name].enabled">
            {{ role.name }}（{{ role.desc }}）
          </el-checkbox>
          <el-input-number
            v-if="createForm.roles[role.name].enabled"
            v-model="createForm.roles[role.name].count"
            :min="1"
            class="ml-3"
            size="mini"
          />
        </div>

        <el-form-item label="管理员密码" :required="true">
          <el-input
            v-model="createForm.pwd"
            show-password
            placeholder="请输入管理员密码"
          />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="doCreateGame" :loading="createLoading">
        创建对局
      </el-button>
    </div>

    <div v-else-if="gameStatus.joined">
      <el-button type="info" @click="refreshAll" class="mb-3">
        刷新信息
      </el-button>
      <el-button
        type="danger"
        @click="endGame"
        v-if="isJudge"
        class="ml-2"
        :loading="endLoading"
        >结束本局</el-button
      >

      <div v-if="gameData.locked" class="mb-3 p-2 bg-warning rounded">
        ⚠️ 身份已锁定，不可抽牌
      </div>

      <el-collapse v-model="activeCollapse" style="margin-top: 20px">
        <el-collapse-item title="我的身份" name="1">
          <div v-if="isJudge" class="font-bold">上帝</div>
          <div class="font-bold" v-else-if="localPlayer.role">
            {{ localPlayer.seq }} - {{ localPlayer.role }}
            <div
              style="
                font-size: 14px;
                color: #666;
                margin-top: 4px;
                font-weight: normal;
              "
            >
              {{ getRoleDesc(localPlayer.role) }}
            </div>
          </div>
          <el-button
            v-if="!isJudge && !localPlayer.role && !gameData.locked"
            type="success"
            class="mt-2"
            @click="drawRole"
            >抽取身份牌</el-button
          >
        </el-collapse-item>

        <el-collapse-item title="成员列表" name="2">
          <div
            v-for="p in players"
            :key="p.seq || p.name"
            class="py-2 border-bottom"
          >
            <span :class="{ dead: p.dead }">
              <template v-if="p.seq && p.role">
                {{ p.seq }} - {{ p.name }}
                <span v-if="p.dead" style="color: red; margin: 0 5px">
                  [死亡]
                </span>
              </template>
              <template v-else>
                {{ p.name }}
                <span v-if="p.dead" style="color: red; margin-left: 5px">
                  [死亡]
                </span>
              </template>
            </span>
            <span
              v-if="(p.role && isJudge) || p.role === '上帝'"
              class="ml-2 text-muted"
            >
              {{ `(${p.role})` }}
            </span>
            <span v-else-if="!p.role" class="ml-2 text-muted"> 旁观者 </span>

            <el-button
              v-if="isJudge && p.seq"
              type="text"
              :class="p.dead ? 'text-green' : 'text-red'"
              class="ml-2"
              @click="toggleDead(p.seq)"
              style="margin-left: 10px"
            >
              {{ p.dead ? "设为存活" : "标记死亡" }}
            </el-button>
          </div>
        </el-collapse-item>
        <el-collapse-item title="笔记本" name="3">
          <el-input
            v-model="localPlayer.note"
            type="textarea"
            rows="6"
            placeholder="请输入"
          />
        </el-collapse-item>
        <el-collapse-item title="上帝广播" name="4">
          <div v-if="isJudge" class="mb-2">
            <el-input
              v-model="judgeMsg"
              type="textarea"
              rows="2"
              placeholder="请输入"
              style="margin-bottom: 20px"
            />
            <el-button type="primary" class="mt-2" @click="sendMsg">
              发布
            </el-button>
            <el-button
              v-if="isJudge && !gameData.locked"
              type="warning"
              class="mt-2 ml-2"
              @click="lockRoles"
            >
              锁定身份（开局）
            </el-button>
          </div>
          <div class="p-2 bg-light rounded">
            {{ gameData.msg || "暂无内容" }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-dialog
      title="身份配置"
      :visible.sync="gameSettingDialog"
      :fullscreen="true"
    >
      <GameSetting ref="setting" :initial-roles="roleConfigList" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="gameSettingDialog = false">取 消</el-button>
        <el-button type="primary" @click="saveGameSetting"> 确 定 </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import GameSetting from "@/GameSetting.vue";
import { ADMIN_PASSWORD } from "@/const.js";
/* eslint-disable vue/multi-word-component-names */
export default {
  name: "WerewolfGame",
  components: { GameSetting },
  data() {
    return {
      ADMIN_PASSWORD: ADMIN_PASSWORD,
      tempName: "",
      localPlayer: {},
      activeCollapse: ["1", "2", "3", "4"],
      showCreatePanel: false,
      createLoading: false,
      endLoading: false,
      refreshLoading: false,
      editingName: false,
      originalName: "",

      roleConfigList: [],
      createForm: { roles: {}, pwd: "" },

      gameData: {},
      gameStatus: { exist: false, joined: false },
      players: [],
      isJudge: false,
      judgeMsg: "",
      BIN_ID: "6a0f0ecb6610dd3ae88104e3",
      API_KEY: "$2a$10$Z9GMvjcEgBICbobvUeAOp.m7Wg/8FiUiblHXiv7XfVrpxAMEwOz3W",
      gameSettingDialog: false,

      // 身份独立配置BIN 👇 把这里换成你新建的那个身份BIN ID
      settingBinId: "6a12952e6610dd3ae897b04a",
    };
  },
  mounted() {
    this.loadLocal();
    this.getRoleConfig();
    this.getGame();
  },
  methods: {
    // 读取身份配置（独立BIN）
    async getRoleConfig() {
      try {
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.settingBinId}`,
          {
            headers: { "X-Master-Key": this.API_KEY },
          }
        );
        const data = await res.json();
        this.roleConfigList = data.record || [];
        this.rebuildCreateForm();
      } catch (e) {
        console.log(e);
      }
    },

    // 保存身份配置（点确定才保存）
    async saveGameSetting() {
      const final = this.$refs.setting.getFinalList();
      await fetch(`https://api.jsonbin.io/v3/b/${this.settingBinId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": this.API_KEY,
        },
        body: JSON.stringify(final),
      });
      this.roleConfigList = final;
      this.rebuildCreateForm();
      this.gameSettingDialog = false;
      this.$message.success("配置已保存");
    },

    // 重建创建对局表单（永远最新）
    rebuildCreateForm() {
      const roles = {};
      this.roleConfigList.forEach((r) => {
        roles[r.name] = { enabled: false, count: 1 };
      });
      this.createForm.roles = roles;
    },
    async checkAdminPassword() {
      try {
        const { value } = await this.$prompt("请输入管理员密码", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputRequired: true,
          inputType: "password",
          closeOnClickModal: false,
          inputPattern: /\S/,
          inputErrorMessage: "密码不能为空",
        });

        const isOk = value === this.ADMIN_PASSWORD;
        if (isOk) {
          return true;
        } else {
          this.$message.error("密码错误");
          return false;
        }
      } catch {
        // 取消输入直接终止
        return false;
      }
    },
    async askGameSetting() {
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      this.gameSettingDialog = true;
    },

    getRoleDesc(roleName) {
      const role = this.roleConfigList.find((item) => item.name === roleName);
      return role ? role.desc : "暂无描述";
    },

    editName() {
      this.originalName = this.localPlayer.name;
      this.tempName = this.localPlayer.name;
      this.editingName = true;
    },

    cancelEditName() {
      this.editingName = false;
      this.tempName = this.originalName;
    },

    async fetch(url, options = {}) {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Master-Key": this.API_KEY,
        };
        const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}`, {
          headers,
          ...options,
        });
        return await res.json();
      } catch (e) {
        console.log("请求异常");
        return { record: this.gameData || {} };
      }
    },
    loadLocal() {
      const p = localStorage.getItem("werewolf_player");
      this.localPlayer = p
        ? JSON.parse(p)
        : { name: "", role: "", seq: 0, dead: false };
    },
    saveLocal() {
      localStorage.setItem("werewolf_player", JSON.stringify(this.localPlayer));
    },
    saveName() {
      if (!this.tempName.trim()) return;
      this.localPlayer.name = this.tempName.trim();
      this.saveLocal();
      this.editingName = false;
      this.tempName = "";
    },
    async getGame() {
      this.refreshLoading = true;
      const res = await this.fetch();
      this.gameData = res.record || {};
      this.players = this.gameData.players || [];

      const beforeJoined = this.gameStatus.joined;
      this.gameStatus.exist = !!this.gameData.judge;

      if (beforeJoined && !this.gameStatus.exist) {
        this.gameStatus.joined = false;
        this.localPlayer = {
          name: this.localPlayer.name,
          role: "",
          seq: 0,
          dead: false,
          note: this.localPlayer.note || "",
        };
        this.saveLocal();
        this.$message.info("上帝已结束对局");
      }

      const me = this.players.find((i) => i.name === this.localPlayer.name);
      if (me) {
        this.gameStatus.joined = true;
        this.localPlayer = { ...this.localPlayer, ...me };
        this.saveLocal();
      } else {
        this.gameStatus.joined = false;
      }
      this.isJudge = this.gameData.judge === this.localPlayer.name;
      this.refreshLoading = false;
    },
    async saveGame() {
      await this.fetch("", {
        method: "PUT",
        body: JSON.stringify(this.gameData),
      });
    },
    async joinGame() {
      await this.getGame();
      if (!this.gameStatus.exist) {
        this.$message.warning("当前暂无对局，请先创建对局");
        return;
      }
      if (this.players.some((i) => i.name === this.localPlayer.name)) {
        this.gameStatus.joined = true;
        return;
      }
      this.players.push({
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
      });
      this.gameData.players = this.players;
      await this.saveGame();
      this.gameStatus.joined = true;
    },

    createGame() {
      this.showCreatePanel = true;
    },

    async doCreateGame() {
      const { roles, pwd } = this.createForm;
      if (!pwd || pwd.trim() === "") {
        this.$message.error("请输入管理员密码！");
        return;
      }
      if (this.gameStatus.exist && this.gameData.judgePwd !== pwd) {
        this.$message.error("密码错误！");
        return;
      }
      this.createLoading = true;
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
        this.$message.warning("至少3人");
        return;
      }
      this.gameData = {
        judge: this.localPlayer.name,
        judgePwd: pwd,
        roles: gameRoles,
        players: [
          { name: this.localPlayer.name, role: "上帝", seq: 0, dead: false },
        ],
        msg: "对局已创建",
        locked: false,
      };
      await this.saveGame();
      this.createLoading = false;
      this.showCreatePanel = false;
      this.gameStatus = { exist: true, joined: true };
      this.isJudge = true;
      this.refreshAll();
    },

    async drawRole() {
      const g = this.gameData;
      if (g.locked) {
        this.$message.error("已锁定");
        return;
      }
      let fullDeck = [];
      Object.entries(g.roles).forEach(([name, cnt]) => {
        for (let i = 0; i < cnt; i++) fullDeck.push(name);
      });
      this.players.forEach((p) => {
        if (p.role && p.role !== "上帝") {
          const idx = fullDeck.indexOf(p.role);
          if (idx > -1) fullDeck.splice(idx, 1);
        }
      });
      if (fullDeck.length === 0) {
        this.$message.error("发完了");
        return;
      }
      const me = this.players.find((p) => p.name === this.localPlayer.name);
      const usedSeqs = this.players.map((p) => p.seq).filter(Boolean);
      let seq = 1;
      while (usedSeqs.includes(seq)) seq++;
      const rndIdx = Math.floor(Math.random() * fullDeck.length);
      me.role = fullDeck[rndIdx];
      me.seq = seq;
      this.localPlayer = { ...this.localPlayer, ...me };
      this.saveLocal();
      await this.saveGame();
      this.$message.success("抽牌成功");
    },

    async lockRoles() {
      this.gameData.locked = true;
      await this.saveGame();
      this.$message.success("已锁定");
    },

    async toggleDead(seq) {
      const p = this.players.find((i) => seq === i.seq);
      if (p) p.dead = !p.dead;
      await this.saveGame();
      this.$message.success("已切换");
    },

    async sendMsg() {
      this.gameData.msg = this.judgeMsg;
      await this.saveGame();
    },

    async endGame() {
      this.endLoading = true;
      this.gameData = {
        judge: "",
        judgePwd: "",
        roles: {},
        players: [],
        msg: "",
        locked: false,
      };
      await this.saveGame();
      this.gameStatus = { exist: false, joined: false };
      this.localPlayer = {
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
        note: this.localPlayer.note || "",
      };
      this.saveLocal();
      this.endLoading = false;
      this.$message.success("已成功结束本局");
      this.refreshAll();
    },

    refreshAll() {
      this.getGame();
    },
  },
};
</script>

<style scoped>
.werewolf-game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.text-center {
  text-align: center;
}
.border-bottom {
  border-bottom: 1px solid #eee;
}
.dead {
  color: red;
  font-weight: bold;
}
.font-bold {
  font-size: 16px;
  font-weight: bold;
}
.text-red {
  color: red;
}
.text-green {
  color: green;
}
.bg-warning {
  background: #fff7e6;
  border: 1px solid #ffc107;
}
.rounded {
  border-radius: 4px;
  padding: 8px 12px;
}
</style>