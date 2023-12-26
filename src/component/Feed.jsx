import { Box, Stack, Typography } from "@mui/material";
import React from "react";
import SideBar from "./SideBar";
const Feed = () => (
  <Stack
    sx={{
      flexDirection: {
        sx: "column",
        md: "row",
      },
    }}
  >
    <Box
      sx={{
        height: {
          sx: "auto",
          md: "92vh",
        },
        borderRight: "1px solid #3d3d3d",
        px: { sx: 0, md: 2 },
      }}
    >
      <SideBar />
      <Typography
        className="Coppyright"
        variant="body2"
        sx={{ mt: 1.5, color: "#FFF" }}
      >
        Coppyright 2023 NKM Media
      </Typography>
    </Box>
  </Stack>
);

export default Feed;
