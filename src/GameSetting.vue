<template>
  <el-container style="height: 100%">
    <el-header
      height="60px"
      style="
        padding: 0;
        display: flex;
        justify-content: flex-end;
        align-items: start;
      "
    >
      <el-button size="small" type="primary" @click="openDialog()">
        新增身份
      </el-button>
    </el-header>
    <el-main style="padding: 0; height: calc(100% - 60px)">
      <div v-for="(role, index) in roleList" :key="index">
        <div style="margin-bottom: 20px">
          <div>
            <b>{{ role.name }}</b>
            （{{ role.desc }}）
          </div>
          <!-- 新增：展示当前身份绑定的技能 -->
          <div style="font-size: 13px; color: #666; margin-top: 6px">
            绑定技能：
            <span v-if="!role.skills?.length">无</span>
            <span v-else>
              {{
                role.skills
                  .map((key) => ONE_NIGHT_SKILL_MAP[key]?.label)
                  .filter(Boolean)
                  .join("、")
              }}
            </span>
          </div>
        </div>
        <div class="flex-between">
          <el-switch
            v-model="role.enabled"
            active-text="显示"
            inactive-text="隐藏"
          />
          <div style="display: flex; gap: 8px">
            <el-button type="success" size="mini" @click="openDialog(index)">
              编辑
            </el-button>
            <el-button type="danger" size="mini" @click="delRole(index)">
              删除
            </el-button>
          </div>
        </div>
        <el-divider></el-divider>
      </div>
    </el-main>
    <!-- 新增 + 编辑 共用一个弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="editDialog"
      :modal-append-to-body="false"
      :show-close="false"
      :fullscreen="true"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入身份名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入技能描述"
            v-model="editForm.desc"
          >
          </el-input>
        </el-form-item>
        <!-- 技能多选：修复移动端溢出el-select -->
        <el-form-item label="绑定技能">
          <el-select
            v-model="editForm.skills"
            multiple
            placeholder="请选择该身份拥有的技能"
            style="width: 100%"
            popper-append-to-body="false"
            popper-class="skill-select-popper"
            popup-placement="bottom-start"
          >
            <el-option
              v-for="skill in ONE_NIGHT_SKILL_LIST"
              :key="skill.skillKey"
              :label="skill.label"
              :value="skill.skillKey"
            >
              <span>{{ skill.label }}</span>
              <span style="color: #999; font-size: 12px; margin-left: 8px">{{
                skill.desc
              }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialog = false">取 消</el-button>
        <el-button type="primary" @click="saveItem">确 定</el-button>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
import { ONE_NIGHT_SKILL_MAP, ONE_NIGHT_SKILL_LIST } from "@/const.js";
export default {
  props: ["initialRoles"],
  data() {
    return {
      ONE_NIGHT_SKILL_MAP,
      ONE_NIGHT_SKILL_LIST,
      roleList: [],
      editDialog: false,
      editIndex: -1, // -1 = 新增，>=0 = 编辑
      // 仅新增 roleId 字段，其余原样不动
      editForm: { roleId: "", name: "", desc: "", enabled: true, skills: [] },
    };
  },
  created() {
    // 深拷贝后统一遍历，给每一条角色强制补充skills空数组、自动生成唯一roleId
    const rawList = JSON.parse(JSON.stringify(this.initialRoles));
    this.roleList = rawList.map((item) => {
      return {
        skills: [],
        // 旧数据无roleId自动生成唯一ID，原有字段全部保留
        roleId:
          item.roleId ||
          "role_" + Date.now() + Math.random().toString(36).slice(2),
        ...item,
      };
    });
  },
  methods: {
    // 统一打开弹窗（新增/编辑都走这里）
    openDialog(index = -1) {
      this.editIndex = index;
      if (index === -1) {
        // 新增：自动生成唯一id，其余默认值不变
        this.editForm = {
          roleId: "role_" + Date.now() + Math.random().toString(36).slice(2),
          name: "",
          desc: "",
          enabled: true,
          skills: [],
        };
      } else {
        // 编辑：赋值表单，完整保留原有roleId
        this.editForm = { ...this.roleList[index] };
      }
      this.editDialog = true;
    },

    // 统一保存（新增/编辑都走这里）
    saveItem() {
      if (!this.editForm.name.trim()) {
        this.$message.warning("请输入身份名称");
        return;
      }
      if (this.editIndex === -1) {
        // 新增
        this.roleList.push({ ...this.editForm });
      } else {
        // 编辑
        this.roleList[this.editIndex] = { ...this.editForm };
      }
      this.editDialog = false;
    },

    // 删除
    delRole(index) {
      this.roleList.splice(index, 1);
    },

    // 最终提交列表
    getFinalList() {
      return this.roleList;
    },
  },
  computed: {
    // 弹窗标题自动切换
    dialogTitle() {
      return this.editIndex === -1 ? "新增身份" : "编辑身份";
    },
  },
};
</script>
<style>
.skill-select-popper {
  max-width: 100% !important;
}
.skill-select-popper .el-select-dropdown__item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>