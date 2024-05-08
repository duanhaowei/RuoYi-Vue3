import request from '@/utils/request'

// 查询产品类别说明列表
export function listProducttype(query) {
  return request({
    url: '/qrcode/producttype/list',
    method: 'get',
    params: query
  })
}

// 查询产品类别说明详细
export function getProducttype(id) {
  return request({
    url: '/qrcode/producttype/' + id,
    method: 'get'
  })
}

// 新增产品类别说明
export function addProducttype(data) {
  return request({
    url: '/qrcode/producttype',
    method: 'post',
    data: data
  })
}

// 修改产品类别说明
export function updateProducttype(data) {
  return request({
    url: '/qrcode/producttype',
    method: 'put',
    data: data
  })
}

// 删除产品类别说明
export function delProducttype(id) {
  return request({
    url: '/qrcode/producttype/' + id,
    method: 'delete'
  })
}
