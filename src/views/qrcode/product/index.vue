<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="客户编号" prop="customerId">
        <el-input
          v-model="queryParams.customerId"
          placeholder="请输入客户编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品类型" prop="productTypeId">
        <el-input
          v-model="queryParams.productTypeId"
          placeholder="请输入产品类型"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品批次" prop="batch">
        <el-input
          v-model="queryParams.batch"
          placeholder="请输入产品批次"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['qrcode:product:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['qrcode:product:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['qrcode:product:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['qrcode:product:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="productList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="产品编号" align="center" prop="id" /> -->
      <el-table-column label="产品批次" align="center" prop="batch" />
      <el-table-column label="客户名称" align="center" prop="customerId" />
      <el-table-column label="产品详细" align="center" prop="columnjson" />
      <el-table-column label="产品类型" align="center" prop="productTypeId" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['qrcode:product:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['qrcode:product:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改产品信息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="productRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="产品批号" prop="batch">
          <el-input v-model="form.batch" placeholder="请输入产品批次编号" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerId">
          <!-- <el-input v-model="form.customerId" placeholder="请输入客户编号" /> -->
          <el-select
            v-model="form.customerId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入客户的名称"
            remote-show-suffix
            :remote-method="remoteMethod"
            :loading="loading"
            style="width: 240px"
          >
            <el-option
              v-for="item in options"
              :key="item.id"
              :label="item.cname"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品类型" prop="productTypeId">
          <el-input v-model="form.productTypeId" placeholder="请输入产品类型" />
        </el-form-item>
        <el-form-item label="产品详细" prop="columnjson">
          <el-input v-model="form.columnjson" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Product">
import { listProduct, getProduct, delProduct, addProduct, updateProduct } from "@/api/qrcode/product";
import { listCustomer, getCustomer, delCustomer, addCustomer, updateCustomer } from "@/api/qrcode/customer";

const { proxy } = getCurrentInstance();

const productList = ref([]);
const open = ref(false);
const loading = ref(false);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
 
const options = ref([]); 

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    customerId: null,
    productTypeId: null,
    batch: null
  },
  rules: {
    customerId: [
      { required: true, message: "客户编号不能为空", trigger: "blur" }
    ],
    productTypeId: [
      { required: true, message: "产品类型不能为空", trigger: "blur" }
    ],
    batch: [
      { required: true, message: "产品批次不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询产品信息列表 */
function getList() {
  loading.value = true;
  listProduct(queryParams.value).then(response => {
    productList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    customerId: null,
    columnjson: null,
    productTypeId: null,
    batch: null
  };
  proxy.resetForm("productRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加产品信息";
}

function remoteMethod(query) {
  console.debug(query)
  if (query) {
    loading.value = true
    // setTimeout(() => {
    //   loading.value = false
    //   options.value =  [{label:"label1",value:"value1"},{label:"label2",value:"value2"}]
    // }, 200)
    listCustomer({
                pageNum: 1,
                pageSize: 10,
                cname: query,
              }).then(response => {
                loading.value = false
                options.value = response.rows          
                console.debug(response.rows)
    });
    
  } else {
    options.value = []
  }
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getProduct(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改产品信息";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["productRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addProduct(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除产品信息编号为"' + _ids + '"的数据项？').then(function() {
    return delProduct(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('qrcode/product/export', {
    ...queryParams.value
  }, `product_${new Date().getTime()}.xlsx`)
}

getList();
</script>
