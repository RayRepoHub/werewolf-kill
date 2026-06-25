<template>
  <div class="werewolf-game-container" v-loading="refreshLoading">
    <h2 class="text-center">狼人杀对局平台</h2>

    <!-- 未设置昵称 / 编辑昵称 且 未加入对局 -->
    <div
      v-if="(!localPlayer.name || editingName) && !gameStatus.joined"
      class="flex-center"
      style="gap: 10px"
    >
      <el-input
        v-model="tempName"
        placeholder="请输入你的名字"
        style="width: 300px"
      ></el-input>
      <el-button type="primary" @click="saveName">
        {{ editingName ? "保存" : "确认进入" }}
      </el-button>
      <el-button
        v-if="editingName"
        @click="cancelEditName"
        style="margin-left: 0"
      >
        取消
      </el-button>
    </div>

    <!-- 已设置昵称，但未加入对局：功能操作区 -->
    <div
      v-else-if="localPlayer.name && !gameStatus.joined"
      style="text-align: center; margin-bottom: 16px"
    >
      <div style="font-size: 16px; margin-bottom: 20px">
        你好，<span style="color: #1890ff; font-weight: bold">{{
          localPlayer.name
        }}</span>
        <el-button type="text" @click="editName" style="margin-left: 8px">
          <svg-icon icon-class="edit" />
        </el-button>
      </div>

      <div class="game-action-buttons">
        <el-button type="success" @click="createGame"> 创建对局 </el-button>
        <el-button type="warning" @click="joinGame"> 加入对局 </el-button>
        <el-button class="role-btn" @click="askGameSetting">
          身份管理
        </el-button>
        <el-button type="primary" @click="switchServerVisible = true">
          切换服务
        </el-button>
      </div>
    </div>

    <!-- 已加入对局：游戏主面板 -->
    <div v-else-if="gameStatus.joined">
      <el-button type="info" @click="refreshAll"> 刷新信息 </el-button>
      <el-button v-if="isJudge" type="primary" @click="openGodPowerPanel">
        {{ GOD_NAME }}之力
      </el-button>

      <!-- 普通玩家退出按钮 -->
      <el-button
        type="warning"
        @click="quitGame"
        v-if="!isJudge"
        :loading="quitGameLoading"
      >
        退出对局
      </el-button>

      <!-- 上帝结束对局按钮 -->
      <el-button
        type="danger"
        @click="endGame"
        v-if="isJudge"
        :loading="endLoading"
      >
        结束本局
      </el-button>

      <el-collapse v-model="activeCollapse" style="margin-top: 20px">
        <!-- 我的身份面板 -->
        <el-collapse-item name="roleCard">
          <template slot="title">
            我的身份<svg-icon icon-class="cards" class="panel-title-icon" />
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
            style="color: #1890ff; font-size: 15px"
          >
            请静待{{ GOD_NAME }}派发身份
          </div>
          <el-button
            v-else-if="
              !isJudge && !localPlayer.role && !gameData.enableGodPower
            "
            type="success"
            @click="drawRole"
            :disabled="drawRoleLoading"
          >
            抽取身份牌
          </el-button>
        </el-collapse-item>

        <!-- 玩家列表面板 -->
        <el-collapse-item name="playerList">
          <template slot="title">
            玩家列表<svg-icon icon-class="list" class="panel-title-icon" />
          </template>
          <div class="player-list-wrap">
            <div
              v-for="p in players"
              :key="p.seq || p.name"
              class="player-item"
              :class="{
                dead: p.dead,
                'self-player': p.uuid === localPlayer.uuid,
              }"
            >
              <!-- 横向单行容器：序号、名字、标签、操作按钮、备注全部同行垂直居中 -->
              <div class="player-row">
                <div class="player-name-row">
                  <span class="seq-tag">{{ p.seq || "旁" }}</span>
                  <span class="player-name" :class="{ dead: p.dead }">
                    {{ p.name }}
                    <span v-if="p.dead" class="dead-suffix">(出局)</span>
                  </span>
                  <span
                    v-if="(p.role && isJudge) || p.role === GOD_NAME"
                    class="role-tag"
                  >
                    {{ p.role }}
                  </span>
                  <span
                    v-if="
                      gameData.hasThird &&
                      ((isJudge && p.thirdMark) ||
                        (p.thirdMark && localPlayer.thirdMark))
                    "
                    class="third-tag"
                  >
                    {{ p.thirdMark }}
                  </span>
                </div>

                <!-- 上帝操作下拉：和文字同一水平线 -->
                <div v-if="isJudge && p.seq" class="player-actions">
                  <el-dropdown
                    v-if="gameData.hasThird"
                    trigger="click"
                    size="mini"
                  >
                    <el-button size="mini" plain type="primary">
                      操作 <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item @click.native="toggleDead(p.seq)">
                        {{ p.dead ? "设为存活" : "标记出局" }}
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="gameData.hasThird"
                        @click.native="openThirdMarkDialog(p)"
                      >
                        第三方标记
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <el-button
                    v-else
                    @click="toggleDead(p.seq)"
                    size="mini"
                    :type="p.dead ? 'success' : 'danger'"
                  >
                    {{ p.dead ? "设为存活" : "标记出局" }}
                  </el-button>
                </div>

                <!-- 普通玩家备注下拉：禁止给自己、禁止给上帝 -->
                <el-select
                  v-if="
                    !isJudge &&
                    p.uuid !== localPlayer.uuid &&
                    p.role !== GOD_NAME
                  "
                  v-model="localMarks[p.uuid]"
                  size="mini"
                  placeholder="备注"
                  class="mark-select"
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
              </div>
            </div>

            <el-button
              v-if="isJudge"
              type="success"
              size="mini"
              icon="el-icon-copy-document"
              class="broadcast-btn"
              @click="fillPlayerListToBroadcast"
            >
              将列表信息填入广播输入框
            </el-button>
          </div>
        </el-collapse-item>

        <!-- 游戏笔记面板 -->
        <el-collapse-item name="gameNotes">
          <template slot="title">
            游戏笔记<svg-icon icon-class="notebook" class="panel-title-icon" />
          </template>
          <el-input
            v-model="localPlayer.note"
            type="textarea"
            :autosize="{ minRows: 6 }"
            placeholder="请输入"
          />
          <div class="w-full flex-end" style="margin-top: 8px">
            <el-button type="info" size="mini" @click="clearNote">
              清空
            </el-button>
            <el-button type="primary" size="mini" @click="saveNote">
              保存笔记
            </el-button>
          </div>
        </el-collapse-item>

        <!-- 进程计时面板 -->
        <el-collapse-item name="processTimer">
          <template slot="title">
            进程计时<svg-icon icon-class="timer" class="panel-title-icon" />
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

        <!-- 投票信息面板 -->
        <el-collapse-item name="voteInfo">
          <template slot="title">
            投票信息<svg-icon icon-class="ticket" class="panel-title-icon" />
          </template>
          <div class="vote-wrap">
            <!-- 已出局玩家提示 -->
            <div v-if="localPlayer.dead" class="vote-tip dead-tip">
              你已经出局，无法参与投票
            </div>

            <!-- 上帝查看完整投票统计 -->
            <div v-else-if="isJudge" class="judge-vote-box">
              <div
                v-if="Object.keys(voteStat).length || abandonList.length"
                class="vote-list"
              >
                <div
                  v-for="(voters, targetSeq) in voteStat"
                  :key="targetSeq"
                  class="vote-item"
                >
                  <span class="target-num">{{ targetSeq }}号</span>
                  <span class="vote-count">({{ voters.length }}票)</span>：
                  <span class="voter-list">{{ voters.join("号、") }}号</span>
                </div>
                <div
                  v-if="abandonList && abandonList.length > 0"
                  class="abandon-text"
                  :class="{ 'abandon-box': Object.keys(voteStat).length > 0 }"
                >
                  弃票：{{ abandonList.join("号、") }}号
                </div>
              </div>
              <el-button
                v-if="Object.keys(voteStat).length || abandonList.length"
                type="success"
                size="mini"
                icon="el-icon-copy-document"
                @click="fillVoteToBroadcast"
                style="margin-top: 16px"
                class="vote-fill-btn w-full"
              >
                将投票结果填入广播输入框
              </el-button>
              <div v-else class="empty-tip">暂无投票信息</div>
            </div>

            <!-- 普通存活玩家投票操作区 -->
            <div
              v-else-if="localPlayer.role && localPlayer.seq"
              class="player-vote-box"
            >
              <el-input
                v-model.number="voteTarget"
                type="number"
                placeholder="输入你要投的玩家序号"
                class="vote-input"
              ></el-input>
              <div class="flex-end">
                <el-button size="mini" type="info" @click="doAbandon">
                  弃票
                </el-button>
                <el-button size="mini" type="primary" @click="doVote">
                  确认投票
                </el-button>
              </div>
            </div>

            <!-- 未抽身份提示 -->
            <div v-else class="vote-tip empty-tip">请先抽取身份后再投票</div>
          </div>
        </el-collapse-item>

        <!-- 上帝广播面板 -->
        <el-collapse-item name="godBroadcast">
          <template slot="title">
            {{ GOD_NAME }}广播<svg-icon
              icon-class="camera"
              class="panel-title-icon"
            />
          </template>
          <div v-if="isJudge">
            <el-input
              v-model="judgeMsg"
              type="textarea"
              :autosize="{ minRows: 6 }"
              placeholder="请输入"
            />
            <div class="w-full flex-end" style="margin: 8px 0">
              <el-button type="info" size="mini" @click="clearBroadcastMsg">
                清空
              </el-button>
              <el-button
                type="primary"
                size="mini"
                @click="sendMsg"
                :disabled="sendMsgLoading"
              >
                发布消息
              </el-button>
            </div>
          </div>
          <div
            style="
              background: #f0f7ff;
              border-left: 4px solid #1890ff;
              padding: 14px;
              border-radius: 6px;
              white-space: pre-wrap;
              word-break: break-all;
              min-height: 50px;
              line-height: 1.6;
              color: #333;
            "
          >
            {{ gameData.msg || "暂无公告内容" }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 创建对局弹窗 -->
    <CreateGameDialog
      :visible.sync="createDialogVisible"
      :role-config-list="roleConfigList"
      :local-player="localPlayer"
      @create="onCreateGame"
    />

    <!-- 身份管理弹窗 -->
    <el-dialog
      title="身份管理"
      :visible.sync="roleSettingVisible"
      :fullscreen="true"
      :show-close="false"
      class="full-screen-dialog"
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

    <!-- 上帝身份分配弹窗 -->
    <GodPower
      :visible.sync="godPowerVisible"
      :players="players"
      :game-roles="gameRoles"
      @save="handleGodSave"
    />

    <!-- 切换服务弹窗 -->
    <SwitchServer
      :visible.sync="switchServerVisible"
      @change="onServerChange"
    />
  </div>
</template>

<script>
// 引入子组件与全局常量
import GameSetting from "@/GameSetting.vue";
import GodPower from "@/GodPower.vue";
import SwitchServer from "@/SwitchServer.vue";
import CreateGameDialog from "@/CreateGameDialog.vue";
import { ADMIN_PASSWORD, GOD_NAME, API_SERVERS } from "@/const.js";

export default {
  name: "WerewolfGame",
  components: {
    GameSetting,
    GodPower,
    SwitchServer,
    CreateGameDialog,
  },

  data() {
    return {
      // 全局常量映射到模板
      GOD_NAME,
      ADMIN_PASSWORD,

      tempName: "", // 临时编辑昵称
      localPlayer: {}, // 当前本地玩家信息
      activeCollapse: ["roleCard", "playerList", "gameNotes"], // 默认展开的折叠面板
      createDialogVisible: false, // 创建对局弹窗显隐

      // 加载状态
      createLoading: false,
      endLoading: false,
      refreshLoading: false,
      editingName: false, // 是否处于编辑昵称状态
      originalName: "", // 编辑昵称前的原始名称

      roleConfigList: [], // 全局身份配置列表
      createForm: { roles: {}, pwd: "", hasThird: false }, // 创建对局表单 新增hasThird

      gameData: {}, // 对局全局数据
      gameStatus: { exist: false, joined: false }, // 对局状态：是否存在、是否已加入
      players: [], // 在线玩家列表
      isJudge: false, // 当前用户是否为上帝
      judgeMsg: "", // 上帝广播内容
      judgeInitMsg: "对局已创建", // 上帝广播初始内容
      API_BASE: "", // 当前接口服务地址
      roleSettingVisible: false, // 身份管理弹窗显示状态

      saveRoleLoading: false,
      quitGameLoading: false,
      sendMsgLoading: false,

      // 投票相关
      voteTarget: null, // 玩家投票目标序号
      voteStat: {}, // 投票统计结果
      abandonList: [], // 弃票玩家列表

      // 计时器相关
      running: false,
      startTime: 0,
      elapsed: 0,
      timer: null,

      localMarks: {}, // 本地玩家备注（本地持久化）
      gameRoles: {}, // 本局启用的身份配置
      godPowerVisible: false, // 上帝之力弹窗
      enableGodPower: false, // 是否开启上帝手动派身份
      switchServerVisible: false, // 切换服务弹窗
      localReadMsgId: "",
      drawRoleLoading: false, // 抽身份加载锁，防止并发重复请求
    };
  },

  computed: {
    /**
     * 格式化计时文本 分:秒.厘秒
     */
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
    // 初始化服务地址、本地数据、配置、对局信息
    this.API_BASE = this.getCurrentApiBase();
    this.loadLocal();
    this.loadLocalMarks();
    this.getRoleConfig();
    this.getGame();
    this.localReadMsgId = localStorage.getItem("readMsgId") || "";
  },

  beforeDestroy() {
    // 组件销毁清除计时器，防止内存泄漏
    clearInterval(this.timer);
  },

  methods: {
    /**
     * 清空上帝广播输入框内容
     */
    clearBroadcastMsg() {
      this.judgeMsg = "";
      this.$message.info("广播内容已清空");
    },
    /**
     * 一键将完整玩家列表填充到上帝广播输入框
     */
    fillPlayerListToBroadcast() {
      let text = "当前对局玩家列表：\n";
      const hasThirdSwitch = !!this.gameData.hasThird;
      this.players.forEach((p) => {
        let line = "";
        if (p.role === this.GOD_NAME) {
          line = `上帝 - ${p.name}`;
        } else if (p.seq) {
          line = `${p.seq} - ${p.name}(${p.role})${p.dead ? " [出局]" : ""}`;
          // 开启第三方阵营 + 该玩家有标记才拼接
          if (hasThirdSwitch && p.thirdMark.trim()) {
            line += ` 【${p.thirdMark}】`;
          }
        } else {
          line = `${p.name} (旁观者)`;
        }
        text += line + "\n";
      });
      this.judgeMsg = text;
      this.$message.success("已自动填充玩家列表到广播输入框！");
    },
    // 弹出新公告确认弹窗
    showNewMsgConfirm(msg) {
      // 未加入对局不弹出
      if (!this.gameStatus.joined) return;
      // 上帝不弹出
      if (this.isJudge) return;
      // 消息内容条件：空消息、初始化默认公告不弹出
      if (!msg || msg === this.judgeInitMsg || this.localReadMsgId === msg) {
        return;
      }

      this.$confirm(`${msg}`, `【${this.GOD_NAME}广播】`, {
        confirmButtonText: "我已知晓",
        showCancelButton: false,
        closeOnClickModal: false,
        showClose: false,
        customClass: "msg-box",
      })
        .then(() => {
          // 点击确认标记已读
          this.localReadMsgId = msg;
          localStorage.setItem("readMsgId", msg);
        })
        .catch(() => {
          // 消除Promise报错
        });
    },
    async openGodPowerPanel() {
      // 过滤掉上帝自己，判断是否存在其他玩家
      const otherPlayers = this.players.filter((p) => p.role !== this.GOD_NAME);
      if (otherPlayers.length === 0) {
        this.$message.warning("当前暂无其他玩家，无法分配身份");
        return;
      }
      // 有其他玩家才打开弹窗
      this.godPowerVisible = true;
    },
    /**
     * 获取当前选中的服务接口地址
     */
    getCurrentApiBase() {
      let savedKey =
        localStorage.getItem("werewolf_server") || API_SERVERS.default;
      if (!API_SERVERS.list[savedKey]) {
        savedKey = API_SERVERS.default;
      }
      return API_SERVERS.list[savedKey].url;
    },

    /**
     * 切换服务后刷新页面生效
     */
    onServerChange(api) {
      this.API_BASE = api;
      location.reload();
    },

    /**
     * 上帝保存分配后的玩家身份
     */
    async handleGodSave(newPlayers) {
      const god = this.players.find((p) => p.role === this.GOD_NAME);
      this.gameData.players = [god, ...newPlayers];
      await this.saveGame();
      this.refreshAll();
      this.$message.success(`${this.GOD_NAME}之力已生效！`);
    },

    /**
     * 读取本地存储的玩家备注
     */
    loadLocalMarks() {
      const data = localStorage.getItem("localMarks");
      if (data) this.localMarks = JSON.parse(data);
    },

    /**
     * 保存玩家备注到本地存储
     */
    saveLocalMarks() {
      localStorage.setItem("localMarks", JSON.stringify(this.localMarks));
    },

    /**
     * 生成唯一UUID，用于区分玩家
     */
    generateUUID() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );
    },

    /**
     * 清空个人游戏笔记
     */
    clearNote() {
      this.localPlayer.note = "";
      this.saveLocal();
      this.$message.info("笔记已清空");
    },

    /**
     * 保存个人游戏笔记
     */
    saveNote() {
      this.saveLocal();
      this.$message.success("笔记已保存");
    },

    // ========== 计时功能 ==========
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

    /**
     * 一键将投票结果填充到上帝广播输入框
     */
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

    /**
     * 获取全局身份配置
     */
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

    /**
     * 保存身份配置到服务端
     */
    async saveGameSetting() {
      this.saveRoleLoading = true;
      const final = this.$refs.setting.getFinalList();
      try {
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

    /**
     * 根据身份配置重建创建对局表单
     */
    rebuildCreateForm() {
      const roles = {};
      this.roleConfigList.forEach((r) => {
        roles[r.name] = { enabled: false, count: 1 };
      });
      this.createForm.roles = roles;
    },

    /**
     * 校验管理员密码弹窗
     */
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
          customClass: "msg-box",
          center: true,
          showClose: false,
        });
        return value === this.ADMIN_PASSWORD;
      } catch {
        return false;
      }
    },

    /**
     * 打开身份管理面板（需密码验证）
     */
    async askGameSetting() {
      const pass = await this.checkAdminPassword();
      if (!pass) return;
      this.roleSettingVisible = true;
    },

    /**
     * 根据身份名称获取身份描述
     */
    getRoleDesc(roleName) {
      const role = this.roleConfigList.find((item) => item.name === roleName);
      return role ? role.desc : "暂无描述";
    },

    /**
     * 开始编辑昵称
     */
    editName() {
      this.originalName = this.localPlayer.name;
      this.tempName = this.localPlayer.name;
      this.editingName = true;
    },

    /**
     * 取消编辑昵称
     */
    cancelEditName() {
      this.editingName = false;
      this.tempName = this.originalName;
    },

    /**
     * 通用请求封装
     */
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

    /**
     * 读取本地玩家信息
     */
    loadLocal() {
      const p = localStorage.getItem("werewolf_player");
      if (p) {
        this.localPlayer = JSON.parse(p);
        // 兼容旧数据，补充uuid
        if (!this.localPlayer.uuid) {
          this.localPlayer.uuid = this.generateUUID();
        }
      } else {
        // 初始化本地玩家信息
        this.localPlayer = {
          uuid: this.generateUUID(),
          name: "",
          role: "",
          seq: 0,
          dead: false,
          note: "",
          thirdMark: "",
        };
      }
      this.saveLocal();
    },

    /**
     * 保存玩家信息到本地存储
     */
    saveLocal() {
      localStorage.setItem("werewolf_player", JSON.stringify(this.localPlayer));
    },

    /**
     * 保存昵称
     */
    saveName() {
      if (!this.tempName.trim()) return;
      this.localPlayer.name = this.tempName.trim();
      this.saveLocal();
      this.editingName = false;
      this.tempName = "";
    },

    /**
     * 获取对局最新数据
     */
    async getGame() {
      const refreshStart = Date.now();
      this.refreshLoading = true;
      let queryTimeout = null;

      // 7秒请求超时弹窗定时器
      queryTimeout = setTimeout(() => {
        this.$msgbox({
          title: "请求超时",
          message: "当前服务响应过慢，是否立即切换到其他服务？",
          type: "warning",
          center: true,
          showClose: false,
          showCancelButton: true,
          confirmButtonText: "去切换",
          cancelButtonText: "继续等待",
        })
          .then(() => {
            this.switchServerVisible = true;
          })
          .catch(() => {});
      }, 7000);

      try {
        const res = await this.fetch();

        this.gameData = res || {};
        this.gameRoles = this.gameData.roles || {};
        this.players = this.gameData.players || [];

        // 玩家排序：上帝优先 > 有序号玩家 > 旁观者
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
        const me = this.players.find((i) => i.uuid === this.localPlayer.uuid);

        // 对局存在 + 自己在玩家列表：正常保留对局状态
        if (this.gameStatus.exist && me) {
          this.gameStatus.joined = true;
          this.localPlayer = { ...this.localPlayer, ...me };
          this.saveLocal();
        } else {
          // 对局已解散 / 对局存在但自己被移出列表：自动退出对局
          this.gameStatus.joined = false;
          this.localPlayer.role = "";
          this.localPlayer.seq = 0;
          this.localPlayer.dead = false;
          this.saveLocal();

          // 之前处于已加入状态，给出对应提示
          if (beforeJoined) {
            if (!this.gameStatus.exist) {
              this.$message.info(`${this.GOD_NAME}已结束对局`);
            } else {
              this.$message.info("你已被移出对局");
              // 清空本地玩家备注
              this.localMarks = {};
              localStorage.removeItem("localMarks");
            }
          }
        }

        this.isJudge = this.gameData.judge === this.localPlayer.name;
        this.refreshVoteStat();

        // 直接调用封装好的公告弹窗函数
        this.showNewMsgConfirm(this.gameData.msg);
      } catch (err) {
        this.$message.error("刷新失败");
      } finally {
        // 统一清除超时定时器，避免超时弹窗乱弹出
        if (queryTimeout) clearTimeout(queryTimeout);

        // 强制最少300ms loading动画，保证用户感知刷新动作
        const cost = Date.now() - refreshStart;
        const minShowTime = 300;
        if (cost < minShowTime) {
          setTimeout(() => {
            this.refreshLoading = false;
          }, minShowTime - cost);
        } else {
          this.refreshLoading = false;
        }
      }
    },

    /**
     * 保存对局数据到服务端
     */
    async saveGame() {
      await this.fetch("", {
        method: "PUT",
        body: JSON.stringify(this.gameData),
      });
    },

    /**
     * 加入现有对局
     */
    async joinGame() {
      await this.getGame();
      if (!this.gameStatus.exist) {
        this.$message.warning("当前暂无对局，请先创建对局");
        return;
      }

      // 名校验
      const nameExists = this.players.some(
        (i) => i.name === this.localPlayer.name
      );
      if (nameExists) {
        this.$message.error("该名字已被使用，请更换名字！");
        return;
      }

      // 防止重复加入
      const hasMe = this.players.some((i) => i.uuid === this.localPlayer.uuid);
      if (hasMe) {
        this.gameStatus.joined = true;
        return;
      }

      // ========== 房间密码校验逻辑 ==========
      const roomPwd = this.gameData.roomPwd || "";
      if (roomPwd) {
        // 有房间密码，弹出输入框校验
        try {
          const { value } = await this.$prompt("请输入房间密码", "加入对局", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            inputType: "password",
            closeOnClickModal: false,
            customClass: "msg-box",
            center: true,
            showClose: false,
          });
          if (value !== roomPwd) {
            this.$message.error("房间密码错误，无法加入");
            return;
          }
        } catch {
          // 用户点取消，直接终止
          return;
        }
      }

      // 密码校验通过 / 无房间密码，正常加入
      this.players.push({
        uuid: this.localPlayer.uuid,
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
        thirdMark: "",
      });
      this.gameData.players = this.players;
      await this.saveGame();
      this.gameStatus.joined = true;
      this.$message.success("加入成功");
    },

    /**
     * 打开创建对局弹窗
     */
    createGame() {
      this.createDialogVisible = true;
    },

    /**
     * 接收子组件参数，执行创建对局逻辑
     */
    async onCreateGame(params) {
      const { gameRoles, enableGodPower, roomPwd, hasThird } = params;
      this.createLoading = true;

      // 初始化对局数据，存入房间密码
      this.gameData = {
        judge: this.localPlayer.name,
        hasThird: hasThird,
        roles: gameRoles,
        enableGodPower: enableGodPower,
        roomPwd: roomPwd || "", // 房间密码，空代表无密码
        players: [
          {
            uuid: this.localPlayer.uuid,
            name: this.localPlayer.name,
            role: this.GOD_NAME,
            seq: 0,
            dead: false,
            thirdMark: "",
          },
        ],
        msg: this.judgeInitMsg,
        votes: {},
        abandons: [],
      };
      await this.saveGame();
      this.createLoading = false;
      this.createDialogVisible = false;
      this.gameStatus = { exist: true, joined: true };
      this.isJudge = true;
      this.refreshAll();
    },

    /**
     * 抽取身份牌 - 前端并发优化版
     * 解决多人同时抽牌重复稀有身份问题
     */
    async drawRole() {
      // 拦截：如果正在执行抽牌，直接返回，防止重复并发请求
      if (this.drawRoleLoading) return;
      // 开启加载锁，按钮禁用、显示loading
      this.drawRoleLoading = true;

      try {
        // ========== 关键1：先拉取后端最新完整对局数据 ==========
        // 多人同时点击时，每个人都会先拿最新快照，减少身份池重复
        await this.getGame();
        const g = this.gameData;
        let fullDeck = [];

        // 根据当前最新身份配置生成完整牌堆
        Object.entries(g.roles).forEach(([name, cnt]) => {
          for (let i = 0; i < cnt; i++) fullDeck.push(name);
        });

        // ========== 关键2：剔除已经被其他人抽走的身份（最新players列表） ==========
        this.players.forEach((p) => {
          // 上帝身份不参与玩家抽取，跳过
          if (p.role && p.role !== this.GOD_NAME) {
            const idx = fullDeck.indexOf(p.role);
            if (idx > -1) fullDeck.splice(idx, 1);
          }
        });

        // 牌池空了，直接终止
        if (fullDeck.length === 0) {
          this.$message.error("所有身份牌已发放完毕");
          return;
        }

        // 获取当前玩家自身对象
        const me = this.players.find((p) => p.uuid === this.localPlayer.uuid);
        // 收集所有已占用序号，分配最小空序号
        const usedSeqs = this.players.map((p) => p.seq).filter(Boolean);
        let seq = 1;
        while (usedSeqs.includes(seq)) seq++;

        // 本地随机抽取一张身份
        const randomIndex = Math.floor(Math.random() * fullDeck.length);
        const pickRole = fullDeck[randomIndex];
        me.role = pickRole;
        me.seq = seq;

        // 更新本地玩家缓存并持久化到localStorage
        this.localPlayer = { ...this.localPlayer, ...me };
        this.saveLocal();

        // 把新身份数据提交到后端存储
        await this.saveGame();

        // ========== 关键3：保存完成后再次刷新 ==========
        // 同步本次提交后其他玩家的最新状态，刷新本地身份池
        await this.getGame();
        this.$message.success(`抽取成功，你的身份：${pickRole}`);
      } catch (err) {
        // 网络异常、并发冲突报错处理
        console.error("抽身份失败", err);
        this.$message.error("身份分配冲突或网络异常，请重新点击抽取");
        // 出错强制刷新，清除本地脏缓存
        await this.getGame();
      } finally {
        // 无论成功失败，都释放加载锁，恢复按钮可用
        this.drawRoleLoading = false;
      }
    },

    /**
     * 上帝标记/取消玩家出局状态
     */
    async toggleDead(seq) {
      const p = this.players.find((i) => seq === i.seq);
      if (p) p.dead = !p.dead;
      await this.saveGame();
      this.$message.success("已切换");
    },

    /**
     * 上帝发布全局广播
     */
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

    /**
     * 玩家退出对局
     */
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
          customClass: "msg-box",
        }
      )
        .then(async () => {
          // 已有身份需要密码验证
          if (this.localPlayer?.role) {
            const pass = await this.checkAdminPassword();
            if (!pass) return;
          }
          this.quitGameLoading = true;
          // 从玩家列表移除自己
          this.players = this.players.filter(
            (p) => p.uuid !== this.localPlayer.uuid
          );
          this.gameData.players = this.players;
          await this.saveGame();

          // 清空本地对局信息
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
          this.localReadMsgId = "";
          localStorage.removeItem("readMsgId");
        })
        .catch(() => {});
    },

    /**
     * 上帝结束整局游戏
     */
    async endGame() {
      this.$confirm("结束本局后，其他所有成员也将自动退出, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true,
        showClose: false,
        closeOnClickModal: false,
        customClass: "msg-box",
      })
        .then(async () => {
          this.endLoading = true;
          // 清空对局数据
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
          // 重置本地玩家对局信息
          this.localPlayer = {
            ...this.localPlayer,
            role: "",
            seq: 0,
            dead: false,
            note: "",
          };
          this.saveLocal();
          this.localReadMsgId = "";
          localStorage.removeItem("readMsgId");
          this.endLoading = false;
          this.$message.success("已成功结束本局");
          this.refreshAll();
        })
        .catch(() => {});
    },

    /**
     * 手动刷新对局数据
     */
    refreshAll() {
      this.getGame();
    },

    /**
     * 重新计算投票统计
     */
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

    /**
     * 执行投票
     */
    async doVote() {
      if (!this.voteTarget) {
        this.$message.warning("请输入投票序号");
        return;
      }
      await this.getGame();
      const seq = this.localPlayer.seq;
      if (seq === 0) return;

      // 记录投票，移除弃票状态
      this.gameData.votes = this.gameData.votes || {};
      this.gameData.abandons = this.gameData.abandons || [];
      this.gameData.votes[seq] = this.voteTarget;
      const idx = this.gameData.abandons.indexOf(seq);
      if (idx >= 0) this.gameData.abandons.splice(idx, 1);

      await this.saveGame();
      this.refreshVoteStat();
      this.$message.success("投票成功：投给 " + this.voteTarget + " 号");
    },

    /**
     * 执行弃票
     */
    async doAbandon() {
      await this.getGame();
      const seq = this.localPlayer.seq;
      if (seq === 0) return;

      // 记录弃票，移除投票状态
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

    // 新增：打开第三方标记弹窗
    async openThirdMarkDialog(player) {
      const { value } = await this.$prompt(
        "设置该玩家第三方标记，留空清空标记",
        "第三方标记",
        {
          inputValue: player.thirdMark,
          customClass: "msg-box",
          center: true,
          showClose: false,
          closeOnClickModal: false,
        }
      );
      if (value === undefined) return;
      player.thirdMark = value.trim();
      await this.saveGame();
      this.$message.success("第三方标记已更新");
    },
  },
};
</script>

<style lang="scss" scoped>
// 页面最外层容器
.werewolf-game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

// 页面通用基础类
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

// 顶部创建/加入对局按钮组
.game-action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 420px;
  margin: 10px auto 0;

  .el-button {
    color: #fff;
    width: 100%;
    height: 60px;
    font-size: 18px;
    margin-left: 0 !important; // 覆盖Element自带的margin-left
  }

  .role-btn {
    background: #9277e3;
    border-color: #9277e3;
  }
}

// 折叠面板标题小图标
.panel-title-icon {
  margin-left: 4px;
}

// 计时面板数字样式
.timer-box {
  font-family: "Courier New", monospace;
  font-size: 32px;
  font-weight: bold;
  width: 180px;
  margin: 0 auto 16px;
  letter-spacing: 1px;
  text-align: center;
}

// ====================== 玩家列表 嵌套分层核心 ======================
.player-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;

  // 单张玩家卡片容器
  .player-item {
    padding: 12px 14px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 6px;

    // 卡片悬浮样式
    &:hover {
      border-color: #c0c4cc;
    }

    // 当前登录玩家自己的卡片高亮
    &.self-player {
      background-color: #f0f7ff;
      &:hover {
        border-color: #1890ff;
      }
    }

    // 已出局玩家卡片弱化
    &.dead {
      background: #f7f8fa;
      opacity: 0.72;
    }

    // 卡片内横向一行（序号、名字、标签、操作按钮同行）
    .player-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      // 左侧：序号+玩家名+各类标签区域
      .player-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        flex: 1;

        // 序号灰色小方块
        .seq-tag {
          min-width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          background: #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
          color: #333;
        }

        // 玩家名称文字
        .player-name {
          font-size: 15px;
          font-weight: 500;
          // 出局名字变红
          &.dead {
            color: #f5222d;
          }
        }

        // 出局后缀小字 (出局)
        .dead-suffix {
          color: #f5222d;
          font-size: 13px;
        }

        // 上帝可见身份标签
        .role-tag {
          padding: 2px 6px;
          background: #e6f7ff;
          color: #1890ff;
          border-radius: 4px;
          font-size: 12px;
        }

        // 第三方阵营标记标签
        .third-tag {
          padding: 2px 6px;
          background: #f9f0ff;
          color: #9370db;
          border-radius: 4px;
          font-size: 12px;
        }
      }

      // 上帝操作下拉按钮容器
      .player-actions {
        flex-shrink: 0;
      }

      // 普通玩家备注下拉框
      .mark-select {
        width: 110px;
        flex-shrink: 0;
      }
    }

    // 旁观者小字说明
    .player-desc {
      font-size: 12px;
      color: #999;
    }
  }

  // 上帝一键填充广播按钮
  .broadcast-btn {
    margin-top: 6px;
  }
}
// ====================== 投票面板样式新增 ======================
.vote-wrap {
  padding: 4px 0;

  // 通用提示文字
  .vote-tip {
    font-size: 14px;
    line-height: 1.6;
  }
  // 出局灰色提示
  .dead-tip {
    color: #86909c;
  }
  // 空数据浅灰提示
  .empty-tip {
    color: #bfc4cc;
  }

  // 上帝投票统计盒子
  .judge-vote-box {
    line-height: 1.8;

    // 投票条目容器
    .vote-list {
      padding: 8px 10px;
      background: #f7f8fa;
      border-radius: 6px;
    }
    // 单条投票记录
    .vote-item {
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;

      .target-num {
        color: #1890ff;
        font-weight: 500;
      }
      .vote-count {
        color: #666;
        font-size: 13px;
      }
      .voter-list {
        color: #333;
      }
    }
    // 弃票盒子
    .abandon-box {
      border-top: 1px dashed #e5e7eb;
      margin-top: 8px;
      padding-top: 6px;
    }
    // 弃票文字高亮
    .abandon-text {
      color: #f5222d;
      font-weight: bold;
    }
    // 填充广播按钮
    .vote-fill-btn {
      margin-top: 8px;
    }
  }

  // 玩家投票操作区域
  .player-vote-box {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .vote-input {
      width: 100%;
    }
  }
}
</style>