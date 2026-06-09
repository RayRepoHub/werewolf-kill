<template>
  <div class="werewolf-game-container" v-loading="refreshLoading">
    <h2 class="text-center">狼人杀对局平台</h2>

    <div
      v-if="(!localPlayer.name || editingName) && !gameStatus.joined"
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
        <el-button type="info" @click="askGameSetting"> 身份管理 </el-button>
        <el-button
          type="primary"
          plain
          style="margin-left: 10px"
          @click="switchServerVisible = true"
        >
          切换服务
        </el-button>
      </div>
    </div>

    <div v-if="showCreatePanel && !gameStatus.joined" style="margin-top: 20px">
      <el-form label-width="100px">
        <div
          v-for="role in roleConfigList"
          v-show="role.enabled"
          :key="role.name"
          class="mb-3"
          style="margin-bottom: 20px"
        >
          <div
            style="
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            "
          >
            <el-checkbox v-model="createForm.roles[role.name].enabled">
              {{ role.name }}
            </el-checkbox>
            <el-input-number
              v-if="createForm.roles[role.name].enabled"
              v-model="createForm.roles[role.name].count"
              :min="1"
              class="ml-3"
              size="mini"
            />
          </div>
          <div style="font-size: 14px">（{{ role.desc || "暂无描述" }}）</div>
        </div>
        <el-checkbox v-model="enableGodPower" style="margin-bottom: 20px">
          是否由{{ GOD_NAME }}指派身份
        </el-checkbox>
        <el-form-item label="管理员密码" :required="true">
          <el-input
            v-model="createForm.pwd"
            show-password
            placeholder="请输入管理员密码"
          />
        </el-form-item>
      </el-form>
      <div style="width: 100%; display: flex; justify-content: end">
        <el-button
          type="primary"
          @click="doCreateGame"
          :loading="createLoading"
        >
          创建
        </el-button>
      </div>
    </div>

    <div v-else-if="gameStatus.joined">
      <el-button type="info" @click="refreshAll" class="mb-3">
        刷新信息
      </el-button>
      <el-button
        v-if="isJudge"
        type="primary"
        class="mb-3 ml-2"
        @click="godPowerVisible = true"
      >
        {{ GOD_NAME }}之力
      </el-button>

      <!-- 👇 非上帝玩家显示退出按钮 -->
      <el-button
        type="warning"
        @click="quitGame"
        class="ml-2 mb-3"
        v-if="!isJudge"
        :loading="quitGameLoading"
      >
        退出对局
      </el-button>

      <el-button
        type="danger"
        @click="endGame"
        v-if="isJudge"
        class="ml-2"
        :loading="endLoading"
      >
        结束本局
      </el-button>

      <el-collapse v-model="activeCollapse" style="margin-top: 20px">
        <el-collapse-item name="roleCard">
          <template slot="title">
            我的身份<i class="el-icon-s-custom" style="margin-left: 4px" />
          </template>
          <div v-if="isJudge" class="font-bold">{{ GOD_NAME }}</div>
          <div class="font-bold" v-else-if="localPlayer.role">
            {{ localPlayer.seq }} - {{ localPlayer.role }}({{
              localPlayer.name
            }})
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
          <div
            v-if="!isJudge && !localPlayer.role && gameData.enableGodPower"
            class="mt-3"
            style="color: #1890ff; font-size: 15px"
          >
            请静待{{ GOD_NAME }}派发身份
          </div>
          <el-button
            v-else-if="
              !isJudge && !localPlayer.role && !gameData.enableGodPower
            "
            type="success"
            class="mt-2"
            @click="drawRole"
          >
            抽取身份牌
          </el-button>
        </el-collapse-item>

        <el-collapse-item name="playerList">
          <template slot="title">
            玩家列表<i class="el-icon-s-order" style="margin-left: 4px" />
          </template>
          <div
            v-for="p in players"
            :key="p.seq || p.name"
            class="py-2 border-bottom"
          >
            <span :class="{ dead: p.dead }">
              <template v-if="p.seq && p.role">
                <!-- 👇 本地私人备注（本局身份 + 存疑）👇 -->
                <el-select
                  v-if="!isJudge && p.uuid !== localPlayer.uuid"
                  v-model="localMarks[p.uuid]"
                  size="mini"
                  placeholder="备注"
                  style="width: 110px; margin: 4px 8px 4px 0"
                  @change="saveLocalMarks"
                >
                  <el-option label="存疑" value="存疑"></el-option>
                  <el-option
                    v-for="roleName in Object.keys(gameRoles)"
                    :key="roleName"
                    :label="roleName"
                    :value="roleName"
                  ></el-option>
                </el-select>
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
              v-if="(p.role && isJudge) || p.role === GOD_NAME"
              class="ml-2 text-muted"
            >
              {{ `(${p.role})` }}
            </span>
            <span v-else-if="!p.role" class="ml-2 text-muted"> (旁观者) </span>

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
        <el-collapse-item name="gameNotes">
          <template slot="title">
            游戏笔记<i class="el-icon-info" style="margin-left: 4px" />
          </template>
          <el-input
            v-model="localPlayer.note"
            type="textarea"
            rows="6"
            placeholder="请输入"
          />
          <div class="w-full flex-end" style="margin-top: 8px; gap: 8px">
            <el-button size="mini" icon="el-icon-delete" @click="clearNote">
              清空笔记
            </el-button>
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-document"
              @click="saveNote"
            >
              保存笔记
            </el-button>
          </div>
        </el-collapse-item>
        <el-collapse-item name="processTimer">
          <template slot="title">
            进程计时<i class="el-icon-s-opportunity" style="margin-left: 4px" />
          </template>
          <div style="padding: 15px; text-align: center">
            <div class="timer-box">{{ timeStr }}</div>
            <div style="display: flex; justify-content: center; gap: 10px">
              <el-button
                size="mini"
                type="success"
                @click="start"
                :disabled="running"
              >
                计时
              </el-button>
              <el-button
                size="mini"
                type="warning"
                @click="stop"
                :disabled="!running"
              >
                暂停
              </el-button>
              <el-button size="mini" type="info" @click="reset">重置</el-button>
            </div>
          </div>
        </el-collapse-item>
        <!-- ====================== 新增：投票信息面板 ====================== -->
        <el-collapse-item name="voteInfo">
          <template slot="title">
            投票信息<i class="el-icon-s-ticket" style="margin-left: 4px" />
          </template>
          <div v-if="localPlayer.dead">你已经死亡，无法参与投票</div>
          <div v-else-if="isJudge" style="line-height: 1.8">
            <div v-if="Object.keys(voteStat).length || abandonList.length">
              <div v-for="(voters, targetSeq) in voteStat" :key="targetSeq">
                {{ targetSeq }}号({{ voters.length }}票)：{{
                  voters.join("号、")
                }}号
              </div>
              <div
                style="margin-top: 8px; font-weight: bold"
                v-if="abandonList && abandonList.length > 0"
              >
                弃票：{{ abandonList.join("号、") }}号
              </div>
              <!-- 有数据才显示填充按钮 -->
              <el-button
                type="success"
                size="mini"
                icon="el-icon-copy-document"
                @click="fillVoteToBroadcast"
                style="margin-top: 8px"
              >
                一键填充投票结果到广播
              </el-button>
            </div>
            <div v-else>暂无投票信息</div>
          </div>
          <div v-else-if="localPlayer.role && localPlayer.seq">
            <el-input
              v-model.number="voteTarget"
              type="number"
              placeholder="输入你要投的玩家序号"
              style="width: 200px; margin-bottom: 8px"
            ></el-input>
            <div style="display: flex; gap: 10px">
              <el-button size="mini" type="info" @click="doAbandon">
                弃票
              </el-button>
              <el-button size="mini" type="primary" @click="doVote">
                确认投票
              </el-button>
            </div>
            <div style="margin-top: 10px">
              当前你的选择：{{ voteTarget ? voteTarget + "号" : "弃票" }}
            </div>
          </div>
          <div v-else>请先抽取身份后再投票</div>
        </el-collapse-item>
        <!-- =================================================================== -->

        <el-collapse-item name="godBroadcast">
          <template slot="title">
            {{ GOD_NAME }}广播<i
              class="el-icon-message-solid"
              style="margin-left: 4px"
            />
          </template>
          <div v-if="isJudge" class="mb-2">
            <el-input
              v-model="judgeMsg"
              type="textarea"
              rows="6"
              placeholder="请输入"
            />
            <div class="w-full flex-end">
              <el-button
                type="primary"
                size="mini"
                class="mt-2"
                @click="sendMsg"
                :loading="sendMsgLoading"
                style="margin-top: 8px"
              >
                发布
              </el-button>
            </div>
          </div>
          <div
            class="p-2 bg-light rounded"
            style="white-space: pre-wrap; word-break: break-all"
          >
            {{ gameData.msg || "暂无内容" }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-dialog
      title="身份管理"
      :visible.sync="roleSettingVisible"
      :fullscreen="true"
      class="role-set-dialog"
    >
      <GameSetting ref="setting" :initial-roles="roleConfigList" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="roleSettingVisible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="saveRoleLoading"
          @click="saveGameSetting"
        >
          保 存
        </el-button>
      </span>
    </el-dialog>
    <GodPower
      :visible.sync="godPowerVisible"
      :players="players"
      :game-roles="gameRoles"
      @save="handleGodSave"
    />
    <SwitchServer
      :visible.sync="switchServerVisible"
      @change="onServerChange"
    />
  </div>
</template>

<script>
import GameSetting from "@/GameSetting.vue";
import GodPower from "@/GodPower.vue";
import { ADMIN_PASSWORD, GOD_NAME, API_SERVERS } from "@/const.js"; // 加 API_SERVERS
import SwitchServer from "@/SwitchServer.vue"; // 新增

/* eslint-disable vue/multi-word-component-names */
export default {
  name: "WerewolfGame",
  components: { GameSetting, GodPower, SwitchServer },
  data() {
    return {
      GOD_NAME: GOD_NAME, // 注入模板使用
      ADMIN_PASSWORD: ADMIN_PASSWORD,
      tempName: "",
      localPlayer: {},
      activeCollapse: ["roleCard", "playerList", "gameNotes"],
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
      API_BASE: "", // 后端服务地址，从常量文件读取
      roleSettingVisible: false,

      saveRoleLoading: false,
      quitGameLoading: false,
      sendMsgLoading: false,

      // === 投票新增变量 ===
      voteTarget: null,
      voteStat: {},
      abandonList: [],
      running: false,
      startTime: 0,
      elapsed: 0,
      timer: null,
      localMarks: {}, // 本地备注（永久保存）
      gameRoles: {}, // 本局游戏启用的身份
      godPowerVisible: false,
      enableGodPower: false, // 是否启用上帝之力
      switchServerVisible: false,
    };
  },
  computed: {
    timeStr() {
      let ms = this.elapsed;
      const minutes = Math.floor(ms / 6000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((ms % 6000) / 100)
        .toString()
        .padStart(2, "0");
      const centiseconds = (ms % 100).toString().padStart(2, "0");
      return `${minutes}:${seconds}.${centiseconds}`;
    },
  },
  mounted() {
    this.API_BASE = this.getCurrentApiBase(); // 初始化 API_BASE
    this.loadLocal();
    this.loadLocalMarks();
    this.getRoleConfig();
    this.getGame();
  },
  beforeDestroy() {
    clearInterval(this.timer);
  },
  methods: {
    getCurrentApiBase() {
      let savedKey =
        localStorage.getItem("werewolf_server") || API_SERVERS.default;
      if (!API_SERVERS.list[savedKey]) {
        savedKey = API_SERVERS.default;
      }
      return API_SERVERS.list[savedKey].url;
    },
    onServerChange(api) {
      this.API_BASE = api;
      location.reload();
    },
    async handleGodSave(newPlayers) {
      // 找到上帝
      const god = this.players.find((p) => p.role === this.GOD_NAME);
      // 合并上帝 + 修改后的玩家
      this.gameData.players = [god, ...newPlayers];
      await this.saveGame();
      this.refreshAll();
      this.$message.success(`${this.GOD_NAME}之力已生效！`);
    },
    // 加载本地备注
    loadLocalMarks() {
      const data = localStorage.getItem("localMarks");
      if (data) this.localMarks = JSON.parse(data);
    },

    // 保存本地备注
    saveLocalMarks() {
      localStorage.setItem("localMarks", JSON.stringify(this.localMarks));
    },
    // 标准加密级 UUID
    generateUUID() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          ((crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c / 4))
        ).toString(16)
      );
    },

    // 清空笔记
    clearNote() {
      this.localPlayer.note = "";
      this.saveLocal();
      this.$message.info("笔记已清空");
    },
    // 保存笔记
    saveNote() {
      this.saveLocal();
      this.$message.success("笔记已保存");
    },
    start() {
      if (this.running) return;
      this.running = true;
      this.startTime = Date.now() - this.elapsed * 10;
      this.timer = setInterval(() => {
        this.elapsed = Math.floor((Date.now() - this.startTime) / 10);
      }, 50);
    },
    stop() {
      this.running = false;
      clearInterval(this.timer);
    },
    reset() {
      this.stop();
      this.elapsed = 0;
    },
    // 上帝专用：一键把投票结果填充到广播框
    fillVoteToBroadcast() {
      let text = "今日投票结果：\n";
      for (let target in this.voteStat) {
        const voters = this.voteStat[target];
        text += `${target}号(${voters.length}票)：${voters.join("号、")}号\n`;
      }
      if (this.abandonList.length > 0) {
        text += `弃票：${this.abandonList.join("号、")}号\n`;
      }
      this.judgeMsg = text;
      this.$message.success("已自动填充投票结果到广播输入框！");
    },

    // 读取身份配置（独立BIN）
    async getRoleConfig() {
      try {
        const res = await fetch(`${this.API_BASE}/roleData`);
        const data = await res.json();
        this.roleConfigList = data.roleListArr || [];
        this.rebuildCreateForm();
      } catch (e) {
        console.log(e);
      }
    },

    // 保存身份配置
    async saveGameSetting() {
      this.saveRoleLoading = true;
      const final = this.$refs.setting.getFinalList();
      try {
        // 包成对象再PUT
        await fetch(`${this.API_BASE}/roleData`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roleListArr: final }),
        });
        this.roleConfigList = final;
        this.rebuildCreateForm();
        this.$message.success("配置已保存");
      } catch (err) {
        this.$message.error("保存失败");
      }
      this.saveRoleLoading = false;
      this.roleSettingVisible = false;
    },

    // 重建创建对局表单
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
        return value === this.ADMIN_PASSWORD;
      } catch {
        return false;
      }
    },
    async askGameSetting() {
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      this.roleSettingVisible = true;
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
        const res = await fetch(`${this.API_BASE}/roomData`, {
          headers: { "Content-Type": "application/json" },
          ...options,
        });
        return await res.json();
      } catch (e) {
        console.error("请求异常", e);
        return this.gameData || {};
      }
    },
    loadLocal() {
      const p = localStorage.getItem("werewolf_player");
      if (p) {
        this.localPlayer = JSON.parse(p);
        if (!this.localPlayer.uuid) {
          this.localPlayer.uuid = this.generateUUID();
        }
      } else {
        this.localPlayer = {
          uuid: this.generateUUID(),
          name: "",
          role: "",
          seq: 0,
          dead: false,
          note: "",
        };
      }
      this.saveLocal();
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
      try {
        const res = await this.fetch();
        this.gameData = res || {};
        this.gameRoles = this.gameData.roles || {};
        this.players = this.gameData.players || [];

        // 排序：上帝 → 序号 → 旁观者
        this.players.sort((a, b) => {
          if (a.role === this.GOD_NAME) return -1;
          if (b.role === this.GOD_NAME) return 1;
          const aHasSeq = a.seq > 0;
          const bHasSeq = b.seq > 0;
          if (aHasSeq && bHasSeq) return a.seq - b.seq;
          if (aHasSeq) return -1;
          if (bHasSeq) return 1;
          return 0;
        });

        const beforeJoined = this.gameStatus.joined;
        this.gameStatus.exist = !!this.gameData.judge;

        if (beforeJoined && !this.gameStatus.exist) {
          this.gameStatus.joined = false;
          this.localPlayer = {
            ...this.localPlayer,
            role: "",
            seq: 0,
            dead: false,
            note: "",
          };
          this.saveLocal();
          this.$message.info(`${this.GOD_NAME}已结束对局`);
        }

        const me = this.players.find((i) => i.uuid === this.localPlayer.uuid);
        if (me) {
          this.gameStatus.joined = true;
          this.localPlayer = { ...this.localPlayer, ...me };
          this.saveLocal();
        } else {
          this.gameStatus.joined = false;
          // 退出房间 → 强制清空身份
          this.localPlayer.role = "";
          this.localPlayer.seq = 0;
          this.localPlayer.dead = false;
          this.saveLocal();
        }
        this.isJudge = this.gameData.judge === this.localPlayer.name;
        this.refreshVoteStat();
      } catch (err) {
        this.$message.error("刷新失败");
      }
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

      // 重名判断
      const nameExists = this.players.some(
        (i) => i.name === this.localPlayer.name
      );
      if (nameExists) {
        this.$message.error("该名字已被使用，请更换名字！");
        return;
      }

      // UUID 去重
      const hasMe = this.players.some((i) => i.uuid === this.localPlayer.uuid);
      if (hasMe) {
        this.gameStatus.joined = true;
        return;
      }

      this.players.push({
        uuid: this.localPlayer.uuid,
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
      });
      this.gameData.players = this.players;
      await this.saveGame();
      this.gameStatus.joined = true;
      this.$message.success("加入成功");
    },

    createGame() {
      this.showCreatePanel = !this.showCreatePanel;
    },

    async doCreateGame() {
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
        roles: gameRoles,
        enableGodPower: this.enableGodPower,
        players: [
          {
            uuid: this.localPlayer.uuid,
            name: this.localPlayer.name,
            role: this.GOD_NAME,
            seq: 0,
            dead: false,
          },
        ],
        msg: "对局已创建",
        votes: {},
        abandons: [],
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

      let fullDeck = [];
      Object.entries(g.roles).forEach(([name, cnt]) => {
        for (let i = 0; i < cnt; i++) fullDeck.push(name);
      });
      this.players.forEach((p) => {
        if (p.role && p.role !== this.GOD_NAME) {
          const idx = fullDeck.indexOf(p.role);
          if (idx > -1) fullDeck.splice(idx, 1);
        }
      });
      if (fullDeck.length === 0) {
        this.$message.error("发完了");
        return;
      }
      const me = this.players.find((p) => p.uuid === this.localPlayer.uuid);
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

    async toggleDead(seq) {
      const p = this.players.find((i) => seq === i.seq);
      if (p) p.dead = !p.dead;
      await this.saveGame();
      this.$message.success("已切换");
    },

    async sendMsg() {
      if (!this.judgeMsg.trim()) {
        this.$message.warning("内容不能为空");
        return;
      }
      this.sendMsgLoading = true;
      this.gameData.msg = this.judgeMsg;
      await this.saveGame();
      this.$message.success("发布成功");
      this.sendMsgLoading = false;
    },

    // 退出对局
    async quitGame() {
      this.$confirm(
        "退出对局后会失去身份牌且移出玩家列表，该操作可能会对本局游戏造成影响，需要更高权限确认（还没有身份的玩家则不需要）",
        "提示",
        {
          confirmButtonText: "确定退出",
          cancelButtonText: "取消",
          type: "warning",
          center: true,
          showClose: false,
          closeOnClickModal: false,
        }
      )
        .then(async () => {
          if (this.localPlayer?.role) {
            const pass = await this.checkAdminPassword();
            if (!pass) return;
          }
          this.quitGameLoading = true;
          this.players = this.players.filter(
            (p) => p.uuid !== this.localPlayer.uuid
          );
          this.gameData.players = this.players;
          await this.saveGame();
          this.localPlayer.role = "";
          this.localPlayer.seq = 0;
          this.localPlayer.dead = false;
          this.localPlayer.note = "";
          this.saveLocal();
          this.gameStatus.joined = false;
          this.quitGameLoading = false;
          this.$message.success("已成功退出对局");
          this.localMarks = {};
          localStorage.removeItem("localMarks");
        })
        .catch(() => {});
    },

    async endGame() {
      this.$confirm("结束本局后，其他所有成员也将自动退出, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true,
        showClose: false,
        closeOnClickModal: false,
      })
        .then(async () => {
          this.endLoading = true;
          this.gameData = {
            judge: "",
            roles: {},
            players: [],
            msg: "",
            votes: {},
            abandons: [],
          };
          await this.saveGame();
          this.gameStatus = { exist: false, joined: false };
          this.localPlayer = {
            ...this.localPlayer,
            role: "",
            seq: 0,
            dead: false,
            note: "",
          };
          this.saveLocal();
          this.endLoading = false;
          this.$message.success("已成功结束本局");
          this.refreshAll();
        })
        .catch(() => {});
    },

    refreshAll() {
      this.getGame();
    },

    // 投票统计
    refreshVoteStat() {
      const votes = this.gameData.votes || {};
      const abandons = this.gameData.abandons || [];
      let stat = {};
      for (let voterSeq in votes) {
        if (voterSeq == 0) continue;
        const target = votes[voterSeq];
        if (!stat[target]) stat[target] = [];
        stat[target].push(Number(voterSeq));
      }
      this.voteStat = stat;
      this.abandonList = abandons.filter((num) => num != 0).map(Number);
    },

    async doVote() {
      if (!this.voteTarget) {
        this.$message.warning("请输入投票序号");
        return;
      }
      await this.getGame();
      const seq = this.localPlayer.seq;
      if (seq === 0) return;

      this.gameData.votes = this.gameData.votes || {};
      this.gameData.abandons = this.gameData.abandons || [];
      this.gameData.votes[seq] = this.voteTarget;

      const idx = this.gameData.abandons.indexOf(seq);
      if (idx >= 0) this.gameData.abandons.splice(idx, 1);

      await this.saveGame();
      this.refreshVoteStat();
      this.$message.success("投票成功：投给 " + this.voteTarget + " 号");
    },

    async doAbandon() {
      await this.getGame();
      const seq = this.localPlayer.seq;
      if (seq === 0) return;

      this.gameData.votes = this.gameData.votes || {};
      this.gameData.abandons = this.gameData.abandons || [];
      delete this.gameData.votes[seq];

      if (!this.gameData.abandons.includes(seq)) {
        this.gameData.abandons.push(seq);
      }

      this.voteTarget = null;
      await this.saveGame();
      this.refreshVoteStat();
      this.$message.info("你已弃票");
    },
  },
};
</script>

<style scoped>
.timer-box {
  font-family: "Courier New", monospace;
  font-size: 32px;
  font-weight: bold;
  width: 180px;
  margin: 0 auto 16px;
  letter-spacing: 1px;
  text-align: center;
}
::v-deep .role-set-dialog .el-dialog.is-fullscreen {
  height: 100vh !important;
  display: flex;
  flex-direction: column;
}
::v-deep .role-set-dialog .el-dialog__body {
  height: calc(100% - 200px);
  overflow-y: scroll;
  padding: 0 20px;
}
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
}
</style>