//using a Lua script to inject submission metadata safely without race conditions
export const UPDATE_USER_STATE_LUA = `
  local metadataKey = KEYS[1]
  local userId = ARGV[1]
  local subId = ARGV[2]
  local probId = ARGV[3]
  local status = ARGV[4]
  local subTime = ARGV[5]

  -- Get existing metadata hash map entry
  local userRaw = redis.call('HGET', metadataKey, userId)
  local userData = { problems = {}, processedSubmissions = {} }
  
  if userRaw then
      userData = cjson.decode(userRaw)
  end

  -- Idempotency check
  for _, id in ipairs(userData.processedSubmissions) do
      if id == subId then
          return userRaw -- Already processed, skip execution
      end
  end

  -- Initialize problem track if empty
  if not userData.problems[probId] then
      userData.problems[probId] = {}
  end

  -- Append new submission
  table.insert(userData.problems[probId], {
      submissionId = subId,
      submittedAt = tonumber(subTime),
      status = status
  })

  -- Track processed submission ID
  table.insert(userData.processedSubmissions, subId)

  -- Encode and save back to Hash Map
  local updatedRaw = cjson.encode(userData)
  redis.call('HSET', metadataKey, userId, updatedRaw)

  return updatedRaw
`;