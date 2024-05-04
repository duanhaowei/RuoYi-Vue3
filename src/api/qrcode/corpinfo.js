import request from '@/utils/request'

// 查询公司信息列表
export function listCorpinfo(query) {
  return request({
    url: '/qrcode/corpinfo/list',
    method: 'get',
    params: query
  })
}

// 查询公司信息详细
export function getCorpinfo(id) {
  return request({
    url: '/qrcode/corpinfo/' + id,
    method: 'get'
  })
}

// 新增公司信息
export function addCorpinfo(data) {
  return request({
    url: '/qrcode/corpinfo',
    method: 'post',
    data: data
  })
}

// 修改公司信息
export function updateCorpinfo(data) {
  return request({
    url: '/qrcode/corpinfo',
    method: 'put',
    data: data
  })
}

// 删除公司信息
export function delCorpinfo(id) {
  return request({
    url: '/qrcode/corpinfo/' + id,
    method: 'delete'
  })
}
