package sandbox

import "fmt"

type IsolateConfig struct {
	MemoryLimit    int64   //in kb
	TimeLimit      float64 //in seconds
	ExtraTimeLimit float64 //in seconds
	WallTimeLimit  float64 //in seconds
	Stack          int     //in kb, default 64MB
	FileSizeLimit  int64   //in kb, default 16MB
	DirMounts      []MountDir
}

type MountDir struct {
	Source      string
	Destination string
	Writable    bool
	NoExecute   bool
}

var hardLimits = IsolateConfig{
	MemoryLimit:    3 * 1024 * 1024, // 3 GB
	TimeLimit:      30.0,            // 30 seconds
	ExtraTimeLimit: 2.0,             // 1 second
	WallTimeLimit:  31.0,            // 31 seconds
	Stack:          256 * 1024,       // 256 MB
	FileSizeLimit:  16 * 1024,       // 16 MB
}

func NewIsolateConfig(opts ...func(*IsolateConfig)) *IsolateConfig {
	config := &IsolateConfig{
		MemoryLimit:    512 * 1024, // 512 MB
		TimeLimit:      5.0,        // 5 seconds
		WallTimeLimit:  10.0,       // 10 seconds
		ExtraTimeLimit: 1.0,        // 1 second
		Stack:          hardLimits.Stack,
		FileSizeLimit:  hardLimits.FileSizeLimit,
	}

	for _, opt := range opts {
		opt(config)
	}

	return config
}

func HardLimits() IsolateConfig {
	return hardLimits
}

func (ic *IsolateConfig) applyHardLimits() {
	if ic.MemoryLimit > hardLimits.MemoryLimit {
		ic.MemoryLimit = hardLimits.MemoryLimit
	}
	if ic.TimeLimit > hardLimits.TimeLimit {
		ic.TimeLimit = hardLimits.TimeLimit
	}
	if ic.ExtraTimeLimit > hardLimits.ExtraTimeLimit {
		ic.ExtraTimeLimit = hardLimits.ExtraTimeLimit
	}
	if ic.WallTimeLimit > hardLimits.WallTimeLimit {
		ic.WallTimeLimit = hardLimits.WallTimeLimit
	}
	if ic.Stack > hardLimits.Stack {
		ic.Stack = hardLimits.Stack
	}
	if ic.FileSizeLimit > hardLimits.FileSizeLimit {
		ic.FileSizeLimit = hardLimits.FileSizeLimit
	}
}

func (ic *IsolateConfig) toArgs() []string {
	ic.applyHardLimits()

	args := []string{}

	args = append(args, "-m", fmt.Sprintf("%d", ic.MemoryLimit))
	args = append(args, "-t", fmt.Sprintf("%.2f", ic.TimeLimit))
	args = append(args, "-w", fmt.Sprintf("%.2f", ic.WallTimeLimit))
	args = append(args, "-E", fmt.Sprintf("%.2f", ic.ExtraTimeLimit))
	args = append(args, "-k", fmt.Sprintf("%d", ic.Stack))
	args = append(args, "-f", fmt.Sprintf("%d", ic.FileSizeLimit))

	if ic.DirMounts != nil {
		for _, mount := range ic.DirMounts {
			mountArg := fmt.Sprintf("--dir=%s=%s", mount.Destination, mount.Source)
			if mount.Writable {
				mountArg += ":rw"
			}
			if mount.NoExecute {
				mountArg += ":noexec"
			}
			args = append(args, mountArg)
		}
	}

	return args
}
