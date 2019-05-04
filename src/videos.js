const getVideo = (file) => {
  return new Promise((resolve, reject) => {
    resolve({
      files: [],
      subject: `Sherlock video of the day`,
      text: `Sherlock's best time at ${file.metadata.mediaLink}`
    })
  })
}

module.exports = { getVideo }
