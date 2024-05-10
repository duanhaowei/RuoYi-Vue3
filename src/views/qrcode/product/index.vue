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
      <!-- <el-table-column label="客户名称" align="center" prop="customerId" /> -->
      <el-table-column label="客户名称" align="center" prop="cname" />
      <!-- <el-table-column label="产品类型" align="center" prop="productTypeId" /> -->
      <el-table-column label="产品类型" align="center" prop="pname" />
      <!-- <el-table-column label="产品详细" align="center" prop="columnjson" /> -->
      <el-table-column label="其他详细信息" align="center" prop="columnjson" >
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <template v-for="(ele, index) in JSON.parse(scope.row.columnjson)" :key="ele.k1">
              <!-- {{ ele.k1 }}: {{ ele.v }} -->
              {{ ele.v }}/ 
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Printer" @click="qrcode(scope.row)">二维码</el-button>
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
          <!-- <el-input v-model="form.productTypeId" placeholder="请输入产品类型" /> -->
          <el-select
            v-model="form.productTypeId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入产品类型的名称"
            remote-show-suffix
            :remote-method="remoteMethod2"
            :loading="loading"
            style="width: 240px"
          >
            <el-option
              v-for="item in options2"
              :key="item.id"
              :label="item.pname"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="产品详细" prop="columnjson">
          <el-input v-model="form.columnjson" type="textarea" placeholder="请输入内容" />
        </el-form-item> -->
        <div class="flex gap-4" v-for="e in formRowDate" :key="e.k">
          <el-input v-model="e.k1" placeholder="新增字段" style="width: 80px;"/>
          <el-input v-model="e.v" placeholder="新增字段值" style="flex:1"/>
        </div>
      </el-form>
      <div style="text-align: right;">
        <!-- <el-button type="info" @click="showFormRowDate">showFormRowDate</el-button> -->
        <el-button type="info" @click="addRow">新增一行</el-button>
        <el-button type="danger" @click="delRow">删除一行</el-button>
      </div>  
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- QR二维码生成框 -->
    <el-dialog
    v-model="qrVisible"
    title="二维码预览"
    width="550"
  >
    
  <div id="qrcode" ref="imgView" @click="onSubmitCode('imgView')">
      <div class="b1">
        <div class="b2">
          <div class="title-logo">
            <div class="logobar left"></div>
            <div class="logo">LOGO</div>
            <div class="logobar right"></div>
          </div>
          <div class="title-text">
           {{qrtitle}}
          </div>
          <qrcode-vue :value="qrvalue" :size="size" level="H" :background="background" foreground="#000000"
            class="qrcodeimg" />
          <div class="qrcode-text">
            {{qrvalue}}
          </div>
        </div>
      </div>
      <div class="footbar">
        扫描二维码查询设备信息
      </div>
    </div>


    <template #footer>
      <div class="dialog-footer">
        <el-button @click="qrVisible = false">取消</el-button>
        <el-button type="primary" @click="printQrcode">
          打印
        </el-button>
      </div>
    </template>
  </el-dialog>
  </div>
</template>

<script setup name="Product">
import { listProduct2 as listProduct, getProduct, delProduct, addProduct, updateProduct } from "@/api/qrcode/product";
import { listCustomer, getCustomer, delCustomer, addCustomer, updateCustomer } from "@/api/qrcode/customer";
import { listProducttype, getProducttype, delProducttype, addProducttype, updateProducttype } from "@/api/qrcode/producttype";

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
const options2 = ref([]); 

const formRowDate = ref([]);

function addRow() {
  formRowDate.value.push({
    k1: "",
    v:""
  })
}

function delRow() {
  formRowDate.value.pop();
}

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
  formRowDate.value = [];
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

function remoteMethod2(query) {
  console.debug(query)
  if (query) {
    loading.value = true
    // setTimeout(() => {
    //   loading.value = false
    //   options.value =  [{label:"label1",value:"value1"},{label:"label2",value:"value2"}]
    // }, 200)
    listProducttype({
                pageNum: 1,
                pageSize: 10,
                pname: query,
              }).then(response => {
                loading.value = false
                options2.value = response.rows          
                console.debug(response.rows)
    });
    
  } else {
    options2.value = []
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
    formRowDate.value = JSON.parse(form.value.columnjson);
    if(formRowDate.value==null) {
      formRowDate.value = []
    }
    options.value = [{id:response.data.customerId,cname:response.data.cname}]
    options2.value = [{id:response.data.productTypeId,pname:response.data.pname}]
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["productRef"].validate(valid => {
    if (valid) {
      form.value.columnjson = JSON.stringify(formRowDate.value);
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

import QrcodeVue from 'qrcode.vue'
// https://www.npmjs.com/package/qrcode.vue
import M2canvas from "html2canvas"
// https://html2canvas.hertzen.com/getting-started
import printJS from 'print-js'
import { ref } from "vue";

const qrVisible = ref(false);

function qrcode(row) {
  const _ids = row.id || ids.value;
  console.log(row)
  console.log(row.id)
  qrvalue.value = _ids;
  qrVisible.value = true;
}

function printQrcode() {
  qrVisible.value = false;
  console.log(row)
}

const imgView = ref();
const qrtitle = ref("xxxxx有限公司");
const qrvalue = ref("");
const size = ref(280);

function onSubmitCode(img) {
      // let imgTag = imgView[img]
      console.info(imgView)
      console.info(imgView.value)
      // 生成canvas前的参数配置，详细配置信息请参考官方文档
      let params = {
        dpi: window.devicePixelRatio * 2 /* DPI 清晰度 */,
        scale: 1 /* 放大倍数 */,
        // with: 700,
        // height:67,
        useCORS: true,
      };
      // 生成canvas图片文件流信息
      console.info(params)
      M2canvas(imgView.value, params).then((canvas) => {
        console.info(canvas)
        // 生成用于展示的数据地址
        printJS({
          printable: canvas.toDataURL(),
          type: "image",
          // header: `<h1 style="font-size: 22px; text-align: center; color: #333;">${this.tInfo.name}</h1>`,
          // documentTitle: this.tInfo.name, // 打印文档的标题this.tInfo.name-自定义标题
        });
      });
      // this.tenantCodeShow = false;
    }

getList();
</script>
<style scoped lang="scss">
.flex{
  display: flex;
  align-items: center;
}
.gap-4{
  gap: 4px;
  margin-bottom: 18px;
}

/* qrcode相关的CSS */

#qrcode {
  border: 1px solid #000;  
  /* display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; */
  /*  */
  padding: 50px 15px 40px 15px;
  /* background-color: aqua; */
  width: 500px;
  height: 800px;
  /* background-image: url("../assets/daqoqrcode.png"); */
  background-repeat: no-repeat;
  background-size: 100% 100%;
  /*  */
  background-color: var(--base-bg-color);
  --base-color: #b33d1a;
  --base-bg-color: #e3e2de;
  position: relative;
}

#qrcode2 {
  border: 1px solid #000;
  /* display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; */
  /*  */
  padding: 50px 15px 40px 15px;
  /* background-color: aqua; */
  width: 500px;
  height: 800px;
  /* background-image: url("../assets/daqoqrcode.png"); */
  background-repeat: no-repeat;
  background-size: 100% 100%;
  /*  */
  background-color: var(--base-bg-color);
  --base-color: #b33d1a;
  --base-bg-color: #FFF;
  position: relative;
}

.b1 {
  border: 3px solid var(--base-color);
  width: 100%;
  height: 100%;
  padding: 15px;
}

.b2 {
  border: 3px solid var(--base-color);
  width: 100%;
  height: 100%;
  /* padding: 15px; */
  display: flex;
  /* justify-content: center; */
  align-items: center;
  flex-direction: column;
}

.title-logo {
  width: 100%;
  display: flex;
  height: 15%;
  /* background-color: #f5b73234; */
  flex-direction: row;
  padding: 0 15px;
}

.title-logo>.logobar {
  /* margin-top: 50%; */
  /* border-bottom: 5px solid var(--base-color); */
  width: 35%;
  height: 50%;
  position: relative;
}

/* .logobar.left {
  border-image: linear-gradient(to right, var(--base-bg-color), var(--base-color)) 1;
}

.logobar.right {
  border-image: linear-gradient(to left, var(--base-bg-color), var(--base-color)) 1;
} */
.logobar.left::after {
  content: '';
  position: absolute;
  display: block;
  margin-top: 32%;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, var(--base-bg-color), var(--base-color));
}

.logobar.right::after {
  content: '';
  position: absolute;
  display: block;
  margin-top: 32%;
  width: 100%;
  height: 5px;
  background: linear-gradient(to left, var(--base-bg-color), var(--base-color));
}

.title-logo>.logo {
  width: 30%;
  height: 100%;
  text-align: center;
  line-height: 100px;
  font-size: 30px;
}


.title-text {
  height: 7%;
  /* background-color: #32f55c34; */
  font-size: 28px;
  text-align: center;
  min-height: 28px;
  /* line-height: 24px; */
}

.qrcodeimg {
  display: inline-block;
  margin-top: 20px;
  border: 3px solid var(--base-color);
  border-radius: 10%;
  /* width: 100px; */
  /* display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; */
  padding: 20px;
}

.qrcode-text {
  padding-top: 40px;
  font-size: 38px;
}

.footbar {
  position: absolute;
  /* top: calc(100% - 90px); */
  top: 649px;
  left: 0px;
  bottom: 0px;
  font-size: 26px;
  color: #ffffff;
  height: 110px;
  line-height: 110px;
  width: 500px;
  background-color: var(--base-color);
  text-align: center;
}

.testcss {
  width: 100%;
  height: 15px;
  position: relative;
}

.testcss::before {
  content: '';
  position: absolute;
  display: block;
  /* top: 0;
  left: 0;
  bottom: 0;
  right: 0; */
  margin: -4px;
  width: 33%;
  height: 5px;
  background: linear-gradient(to left, #000, #FFF);
}



</style>